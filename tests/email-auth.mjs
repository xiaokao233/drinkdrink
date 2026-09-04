const baseUrl = "http://127.0.0.1:4173";
const email = `friend-${Date.now()}@example.com`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  return { response, body: await response.json() };
}

const invalid = await jsonRequest("/api/auth/send-email-code", {
  method: "POST",
  body: JSON.stringify({ email: "not-an-email" })
});
assert(invalid.response.status === 400, "错误邮箱应该被拒绝");

const sent = await jsonRequest("/api/auth/send-email-code", {
  method: "POST",
  body: JSON.stringify({ email })
});
assert(sent.response.ok && /^\d{6}$/.test(sent.body.devCode), "本地邮件测试通道没有返回六位验证码");

const wrong = await jsonRequest("/api/auth/verify-email-code", {
  method: "POST",
  body: JSON.stringify({ email, code: "000000" })
});
assert(wrong.response.status === 400, "错误验证码应该被拒绝");

const verified = await jsonRequest("/api/auth/verify-email-code", {
  method: "POST",
  body: JSON.stringify({ email, code: sent.body.devCode })
});
assert(verified.response.ok && verified.body.token, "正确验证码没有创建登录状态");
assert(verified.body.isNewUser === true, "首次验证应创建新账号");

const session = await jsonRequest("/api/auth/session", {
  headers: { Authorization: `Bearer ${verified.body.token}` }
});
assert(session.response.ok && session.body.user.email === email, "登录状态没有正确恢复");

const logout = await jsonRequest("/api/auth/logout", {
  method: "POST",
  headers: { Authorization: `Bearer ${verified.body.token}` },
  body: "{}"
});
assert(logout.response.ok, "退出登录失败");

const expired = await jsonRequest("/api/auth/session", {
  headers: { Authorization: `Bearer ${verified.body.token}` }
});
assert(expired.response.status === 401, "退出后旧登录状态仍可使用");

console.log("PASS 邮箱验证码、会话恢复与退出登录检查");
