import { json, methodNotAllowed, sessionFromRequest } from "../_auth.mjs";
import { ensureUser } from "../_db.mjs";

export default {
  async fetch(request) {
    if (request.method !== "GET") return methodNotAllowed();
    const user = sessionFromRequest(request);
    if (!user) return json({ ok: false, message: "登录已失效" }, 401);
    const databaseUser = await ensureUser(user);
    return json({ ok: true, user, cloudDataAvailable: databaseUser.configured });
  }
};
