import assert from "node:assert/strict";

process.env.AUTH_ALLOW_DEV_CODE = "true";
process.env.AUTH_DEV_CODE = "246810";
process.env.AUTH_TOKEN_SECRET = "test-secret-that-is-only-used-by-the-vercel-api-test";

const sendHandler = (await import("../api/auth/send-email-code.mjs")).default;
const verifyHandler = (await import("../api/auth/verify-email-code.mjs")).default;
const sessionHandler = (await import("../api/auth/session.mjs")).default;
const logoutHandler = (await import("../api/auth/logout.mjs")).default;
const email = "vercel-test@example.com";

function request(path, method = "GET", body, token) {
  return new Request(`https://drinkdrink.example${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

const sentResponse = await sendHandler.fetch(request("/api/auth/send-email-code", "POST", { email }));
const sent = await sentResponse.json();
assert.equal(sentResponse.status, 200);
assert.equal(sent.devCode, "246810");
assert.ok(sent.challenge);

const wrongResponse = await verifyHandler.fetch(request("/api/auth/verify-email-code", "POST", {
  email,
  code: "000000",
  challenge: sent.challenge
}));
assert.equal(wrongResponse.status, 400);

const verifiedResponse = await verifyHandler.fetch(request("/api/auth/verify-email-code", "POST", {
  email,
  code: sent.devCode,
  challenge: sent.challenge
}));
const verified = await verifiedResponse.json();
assert.equal(verifiedResponse.status, 200);
assert.ok(verified.token);
assert.equal(verified.user.email, email);

const sessionResponse = await sessionHandler.fetch(request("/api/auth/session", "GET", null, verified.token));
const session = await sessionResponse.json();
assert.equal(sessionResponse.status, 200);
assert.equal(session.user.id, verified.user.id);

const logoutResponse = await logoutHandler.fetch(request("/api/auth/logout", "POST"));
assert.equal(logoutResponse.status, 200);

console.log("PASS Vercel 云函数验证码与签名登录检查");
