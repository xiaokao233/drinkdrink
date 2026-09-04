import { clearSessionCookie, json, methodNotAllowed } from "../_auth.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") return methodNotAllowed();
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  }
};
