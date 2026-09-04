import webPush from "web-push";
import { database } from "./_db.mjs";

let vapidReady = false;

export function pushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function vapidPublicKey() {
  return pushConfigured() ? process.env.VAPID_PUBLIC_KEY : "";
}

function configureWebPush() {
  if (vapidReady || !pushConfigured()) return pushConfigured();
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:code@mail.genyikou.click",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidReady = true;
  return true;
}

function permits(settings, category) {
  const value = settings && typeof settings === "object" ? settings : {};
  return value[category] !== false;
}

export async function sendPushToUsers(userIds, category, payload) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))].slice(0, 100);
  const sql = database();
  if (!sql || !uniqueIds.length || !configureWebPush()) return { attempted: 0, delivered: 0 };

  const rows = await sql`SELECT id, endpoint, p256dh, auth, expiration_time, settings
    FROM push_subscriptions
    WHERE user_id IN (
      SELECT jsonb_array_elements_text(${JSON.stringify(uniqueIds)}::jsonb)
    )`;
  const subscriptions = rows.filter(row => permits(row.settings, category));
  let delivered = 0;

  await Promise.all(subscriptions.map(async row => {
    try {
      await webPush.sendNotification({
        endpoint: row.endpoint,
        expirationTime: row.expiration_time == null ? null : Number(row.expiration_time),
        keys: { p256dh: row.p256dh, auth: row.auth }
      }, JSON.stringify({ category, ...payload }), { TTL: 10 * 60, urgency: "high" });
      delivered += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await sql`DELETE FROM push_subscriptions WHERE id = ${row.id}`;
      } else {
        console.error("push-delivery", error?.statusCode || error?.message || error);
      }
    }
  }));

  return { attempted: subscriptions.length, delivered };
}
