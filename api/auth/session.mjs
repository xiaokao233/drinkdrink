import { json, methodNotAllowed, sessionFromRequest } from "../_auth.mjs";

export default {
  async fetch(request) {
    if (request.method !== "GET") return methodNotAllowed();
    const user = sessionFromRequest(request);
    if (!user) return json({ ok: false, message: "登录已失效" }, 401);
    return json({ ok: true, user });
  }
};
