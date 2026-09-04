import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const codeLifetimeSeconds = 5 * 60;
export const codeCooldownSeconds = 60;
const sessionLifetimeSeconds = 30 * 24 * 60 * 60;
const localDevelopmentSecret = "genyikou-local-development-only";

export function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export function methodNotAllowed() {
  return json({ ok: false, message: "Method not allowed" }, 405);
}

export async function requestJson(request) {
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > 16_384) throw new Error("request-too-large");
  return JSON.parse(text || "{}");
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254 ? email : "";
}

function tokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.RESEND_API_KEY || localDevelopmentSecret;
}

function signature(value) {
  return createHmac("sha256", tokenSecret()).update(value).digest("base64url");
}

function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

function verify(token, expectedKind) {
  const [encoded, suppliedSignature, ...extra] = String(token || "").split(".");
  if (!encoded || !suppliedSignature || extra.length) return null;
  const expectedSignature = signature(encoded);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload?.kind !== expectedKind || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function codeDigest(email, code) {
  return createHmac("sha256", tokenSecret()).update(`${email}:${code}`).digest("base64url");
}

export function makeVerificationCode() {
  return process.env.AUTH_DEV_CODE || String(randomInt(100000, 1000000));
}

export function createEmailChallenge(email, code) {
  return sign({
    kind: "email-code",
    email,
    codeDigest: codeDigest(email, code),
    expiresAt: Date.now() + codeLifetimeSeconds * 1000
  });
}

export function verifyEmailChallenge(challenge, email, code) {
  const payload = verify(challenge, "email-code");
  if (!payload || payload.email !== email) return false;
  const supplied = Buffer.from(codeDigest(email, code));
  const expected = Buffer.from(String(payload.codeDigest || ""));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function userForEmail(email) {
  const stableId = createHash("sha256").update(email).digest("hex").slice(0, 24);
  return {
    id: `user-${stableId}`,
    email,
    createdAt: new Date().toISOString()
  };
}

export function createSession(email) {
  const user = userForEmail(email);
  return {
    token: sign({
      kind: "session",
      user,
      expiresAt: Date.now() + sessionLifetimeSeconds * 1000
    }),
    user
  };
}

export function sessionFromRequest(request) {
  const match = String(request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const payload = verify(match?.[1], "session");
  return payload?.user?.id && payload?.user?.email ? payload.user : null;
}

export async function deliverVerificationCode(email, code) {
  const hasEmailConfiguration = Boolean(process.env.RESEND_API_KEY && process.env.AUTH_FROM_EMAIL);
  const allowDevelopmentCode = process.env.AUTH_ALLOW_DEV_CODE === "true" || (!process.env.VERCEL && process.env.NODE_ENV !== "production");

  if (!hasEmailConfiguration) {
    if (!allowDevelopmentCode) {
      return { ok: false, status: 503, message: "邮件登录还没有配置好，请稍后再试" };
    }
    return { ok: true, delivery: "development" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
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
    if (!response.ok) return { ok: false, status: 502, message: "邮件暂时没有发出去，请稍后再试" };
    return { ok: true, delivery: "email" };
  } catch {
    return { ok: false, status: 502, message: "邮件暂时没有发出去，请稍后再试" };
  }
}
