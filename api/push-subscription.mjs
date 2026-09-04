import { database, ensureSchema, ensureUser, newId } from "./_db.mjs";
import { json, methodNotAllowed, requestJson, sessionFromRequest } from "./_auth.mjs";
import { pushConfigured, vapidPublicKey } from "./_push.mjs";

const base64Url = /^[A-Za-z0-9_-]+$/;

function cleanSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    drink: source.drink !== false,
    response: source.response !== false,
    relation: source.relation !== false
  };
}

function cleanSubscription(value) {
  const endpoint = String(value?.endpoint || "").trim();
  const p256dh = String(value?.keys?.p256dh || "").trim();
  const auth = String(value?.keys?.auth || "").trim();
  const expirationTime = Number.isFinite(value?.expirationTime) ? Math.trunc(value.expirationTime) : null;
  if (!endpoint.startsWith("https://") || endpoint.length > 2048) return null;
  if (!p256dh || p256dh.length > 512 || !base64Url.test(p256dh)) return null;
  if (!auth || auth.length > 256 || !base64Url.test(auth)) return null;
  return { endpoint, p256dh, auth, expirationTime };
}

async function readStatus(user) {
  const sql = database();
  const rows = await sql`SELECT COUNT(*)::INT AS count FROM push_subscriptions WHERE user_id = ${user.id}`;
  return json({
    ok: true,
    configured: pushConfigured(),
    publicKey: vapidPublicKey(),
    registeredDevices: Number(rows[0]?.count || 0)
  });
}

async function saveSubscription(request, user) {
  if (!pushConfigured()) return json({ ok: false, message: "推送服务还没有配置好" }, 503);
  const body = await requestJson(request);
  const subscription = cleanSubscription(body.subscription);
  if (!subscription) return json({ ok: false, message: "通知订阅无效，请重新开启" }, 400);
  const settings = cleanSettings(body.settings);
  const userAgent = String(request.headers.get("user-agent") || "").slice(0, 320);
  const sql = database();
  await sql`INSERT INTO push_subscriptions
      (id, user_id, endpoint, p256dh, auth, expiration_time, settings, user_agent)
    VALUES (${newId()}, ${user.id}, ${subscription.endpoint}, ${subscription.p256dh}, ${subscription.auth},
      ${subscription.expirationTime}, ${JSON.stringify(settings)}::jsonb, ${userAgent})
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      expiration_time = EXCLUDED.expiration_time,
      settings = EXCLUDED.settings,
      user_agent = EXCLUDED.user_agent,
      updated_at = NOW()`;
  return json({ ok: true, subscribed: true });
}

async function removeSubscription(request, user) {
  const body = await requestJson(request);
  const endpoint = String(body.endpoint || "").trim();
  const sql = database();
  if (endpoint) {
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${user.id} AND endpoint = ${endpoint}`;
  } else {
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${user.id}`;
  }
  return json({ ok: true, subscribed: false });
}

export default {
  async fetch(request) {
    if (!new Set(["GET", "POST", "DELETE"]).has(request.method)) return methodNotAllowed();
    const user = sessionFromRequest(request);
    if (!user) return json({ ok: false, message: "登录已失效" }, 401);
    if (!database()) return json({ ok: false, message: "数据库还没有连接好" }, 503);
    try {
      await ensureSchema();
      await ensureUser(user);
      if (request.method === "GET") return await readStatus(user);
      if (request.method === "POST") return await saveSubscription(request, user);
      return await removeSubscription(request, user);
    } catch (error) {
      console.error("push-subscription", error);
      return json({ ok: false, message: "通知设置暂时没有保存" }, 500);
    }
  }
};
