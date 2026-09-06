import { createServer } from "node:http";
import { randomInt, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const authDataDirectory = join(root, ".data");
const authDataFile = join(authDataDirectory, "auth-store.json");
const authCodeLifetime = 5 * 60 * 1000;
const authCodeCooldown = 60 * 1000;
const authSessionLifetime = 30 * 24 * 60 * 60 * 1000;
const authCookieName = "genyikou_session";
const pendingCodes = new Map();
let authStore;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf"
};

function json(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

async function requestJson(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 16_384) throw new Error("request-too-large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254 ? email : "";
}

async function loadAuthStore() {
  if (authStore) return authStore;
  try {
    const parsed = JSON.parse(await readFile(authDataFile, "utf8"));
    authStore = {
      users: parsed?.users && typeof parsed.users === "object" ? parsed.users : {},
      sessions: parsed?.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {}
    };
  } catch {
    authStore = { users: {}, sessions: {} };
  }
  return authStore;
}

async function saveAuthStore() {
  await mkdir(authDataDirectory, { recursive: true });
  const temporaryFile = `${authDataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(authStore, null, 2), "utf8");
  await rename(temporaryFile, authDataFile);
}

function bearerToken(request) {
  const match = String(request.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function cookieToken(request) {
  const value = String(request.headers.cookie || "")
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${authCookieName}=`))
    ?.slice(authCookieName.length + 1);
  try { return decodeURIComponent(value || ""); } catch { return ""; }
}

function sessionToken(request) {
  return bearerToken(request) || cookieToken(request);
}

function sessionCookie(token) {
  return `${authCookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(authSessionLifetime / 1000)}; HttpOnly; SameSite=Lax`;
}

function clearSessionCookie() {
  return `${authCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

async function sendVerificationCode(request, response) {
  const body = await requestJson(request);
  const email = normalizeEmail(body.email);
  if (!email) return json(response, 400, { ok: false, message: "请输入正确的邮箱" });

  const now = Date.now();
  const pending = pendingCodes.get(email);
  if (pending && pending.cooldownUntil > now) {
    return json(response, 429, {
      ok: false,
      message: "发送得有点快，稍后再试",
      retryAfterSeconds: Math.ceil((pending.cooldownUntil - now) / 1000)
    });
  }

  const code = process.env.AUTH_DEV_CODE || String(randomInt(100000, 1000000));
  let delivery = "development";
  if (process.env.RESEND_API_KEY && process.env.AUTH_FROM_EMAIL) {
    try {
      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.AUTH_FROM_EMAIL,
          to: [email],
          subject: "你的「跟一口」验证码",
          text: `验证码：${code}\n\n5 分钟内有效。如果不是你本人操作，可以忽略这封邮件。`,
          html: `<div style="font-family:sans-serif;line-height:1.7;color:#20343d"><p>你的「跟一口」验证码是：</p><p style="font-size:30px;font-weight:700;letter-spacing:.18em">${code}</p><p>5 分钟内有效。如果不是你本人操作，可以忽略这封邮件。</p></div>`
        })
      });
      if (!mailResponse.ok) throw new Error("email-provider-rejected");
      delivery = "email";
    } catch {
      return json(response, 502, { ok: false, message: "邮件暂时没有发出去，请稍后再试" });
    }
  }

  pendingCodes.set(email, {
    code,
    expiresAt: now + authCodeLifetime,
    cooldownUntil: now + authCodeCooldown,
    attemptsLeft: 5
  });
  return json(response, 200, {
    ok: true,
    delivery,
    ...(delivery === "development" ? { devCode: code } : {}),
    cooldownSeconds: authCodeCooldown / 1000,
    expiresInSeconds: authCodeLifetime / 1000
  });
}

async function verifyCode(request, response) {
  const body = await requestJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").replace(/\D/g, "").slice(0, 6);
  if (!email || code.length !== 6) return json(response, 400, { ok: false, message: "邮箱或验证码不正确" });

  const pending = pendingCodes.get(email);
  if (!pending || pending.expiresAt <= Date.now()) {
    pendingCodes.delete(email);
    return json(response, 400, { ok: false, message: "验证码已失效，请重新发送" });
  }
  if (pending.attemptsLeft <= 1 && pending.code !== code) {
    pendingCodes.delete(email);
    return json(response, 429, { ok: false, message: "尝试次数过多，请重新发送" });
  }
  if (pending.code !== code) {
    pending.attemptsLeft -= 1;
    return json(response, 400, { ok: false, message: "验证码不对，再看一眼" });
  }
  pendingCodes.delete(email);

  const store = await loadAuthStore();
  let user = Object.values(store.users).find(item => item.email === email);
  const isNewUser = !user;
  if (!user) {
    user = { id: `user-${randomUUID()}`, email, createdAt: new Date().toISOString() };
    store.users[user.id] = user;
  }
  const token = randomUUID();
  store.sessions[token] = { userId: user.id, expiresAt: Date.now() + authSessionLifetime };
  await saveAuthStore();
  return json(response, 200, { ok: true, token, user, isNewUser }, { "Set-Cookie": sessionCookie(token) });
}

async function readSession(request, response) {
  const store = await loadAuthStore();
  const token = sessionToken(request);
  const session = store.sessions[token];
  if (!session || session.expiresAt <= Date.now() || !store.users[session.userId]) {
    if (session) {
      delete store.sessions[token];
      await saveAuthStore();
    }
    return json(response, 401, { ok: false, message: "登录已失效" });
  }
  return json(response, 200, { ok: true, user: store.users[session.userId] });
}

async function signOut(request, response) {
  const store = await loadAuthStore();
  const token = sessionToken(request);
  if (token && store.sessions[token]) {
    delete store.sessions[token];
    await saveAuthStore();
  }
  return json(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
}

async function handleApi(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/auth/send-email-code") return sendVerificationCode(request, response);
  if (request.method === "POST" && url.pathname === "/api/auth/verify-email-code") return verifyCode(request, response);
  if (request.method === "GET" && url.pathname === "/api/auth/session") return readSession(request, response);
  if (request.method === "POST" && url.pathname === "/api/auth/logout") return signOut(request, response);
  return json(response, 404, { ok: false, message: "Not found" });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(request, response, url);

    const relativePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    if (relativePath.split(/[\\/]/).some(segment => segment.startsWith("."))) throw new Error("hidden-path");
    const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
    let filePath = join(root, safePath);

    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) filePath = join(filePath, "index.html");

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    if (request.url?.startsWith("/api/")) return json(response, 400, { ok: false, message: "请求没有完成，请稍后再试" });
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`跟一口 MVP: http://127.0.0.1:${port}`);
});
