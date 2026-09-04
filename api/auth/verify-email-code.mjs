import {
  createSession,
  json,
  methodNotAllowed,
  normalizeEmail,
  requestJson,
  verifyEmailChallenge
} from "../_auth.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") return methodNotAllowed();
    try {
      const body = await requestJson(request);
      const email = normalizeEmail(body.email);
      const code = String(body.code || "").replace(/\D/g, "").slice(0, 6);
      if (!email || code.length !== 6) return json({ ok: false, message: "邮箱或验证码不正确" }, 400);
      if (!verifyEmailChallenge(body.challenge, email, code)) {
        return json({ ok: false, message: "验证码不对或已失效，请重新发送" }, 400);
      }

      const session = createSession(email);
      return json({ ok: true, ...session, isNewUser: false });
    } catch {
      return json({ ok: false, message: "请求没有完成，请稍后再试" }, 400);
    }
  }
};
