import {
  codeCooldownSeconds,
  codeLifetimeSeconds,
  createEmailChallenge,
  deliverVerificationCode,
  json,
  makeVerificationCode,
  methodNotAllowed,
  normalizeEmail,
  requestJson
} from "../_auth.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") return methodNotAllowed();
    try {
      const body = await requestJson(request);
      const email = normalizeEmail(body.email);
      if (!email) return json({ ok: false, message: "请输入正确的邮箱" }, 400);

      const code = makeVerificationCode();
      const delivery = await deliverVerificationCode(email, code);
      if (!delivery.ok) return json({ ok: false, message: delivery.message }, delivery.status);

      return json({
        ok: true,
        delivery: delivery.delivery,
        challenge: createEmailChallenge(email, code),
        ...(delivery.delivery === "development" ? { devCode: code } : {}),
        cooldownSeconds: codeCooldownSeconds,
        expiresInSeconds: codeLifetimeSeconds
      });
    } catch {
      return json({ ok: false, message: "请求没有完成，请稍后再试" }, 400);
    }
  }
};
