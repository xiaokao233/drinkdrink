import { database, ensureSchema, ensureUser, newId, newInviteCode } from "./_db.mjs";
import { json, methodNotAllowed, requestJson, sessionFromRequest } from "./_auth.mjs";

const cupIds = new Set(["cup-01", "cup-02", "cup-03", "cup-04", "cup-05", "cup-06"]);
const hexColor = /^#[0-9a-f]{6}$/i;

function cleanText(value, length) {
  return String(value || "").trim().slice(0, length);
}

function cleanColors(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const colors = Object.fromEntries(Object.entries(value)
    .filter(([key, color]) => /^[a-z][a-z0-9-]{0,20}$/i.test(key) && hexColor.test(String(color)))
    .map(([key, color]) => [key, String(color).toUpperCase()]));
  return Object.keys(colors).length ? colors : null;
}

function timeLabel(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

async function profileFor(userId) {
  const sql = database();
  const rows = await sql`SELECT name, cup_id, colors FROM profiles WHERE user_id = ${userId} LIMIT 1`;
  if (!rows.length) return null;
  return { name: rows[0].name, cupId: rows[0].cup_id, colors: rows[0].colors };
}

async function relationMembers(relationId) {
  const sql = database();
  return sql`SELECT u.id, p.name, p.cup_id, p.colors, rm.joined_at
    FROM relation_members rm
    JOIN users u ON u.id = rm.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE rm.relation_id = ${relationId}
    ORDER BY rm.joined_at ASC`;
}

function publicPerson(row, relation = "一起喝") {
  return {
    id: row.id,
    name: row.name || "新朋友",
    relation,
    cupId: row.cup_id || "cup-01",
    colors: row.colors || { body: "#55D8FF", label: "#FF8D70", handle: "#FFE45C" }
  };
}

async function readState(user) {
  const sql = database();
  const profile = await profileFor(user.id);
  const relationRows = await sql`SELECT r.id, r.creator_user_id, r.invite_code, r.created_at,
      rm.note, rm.receive, rm.send,
      (SELECT COUNT(*)::INT FROM relation_members members WHERE members.relation_id = r.id) AS member_count
    FROM relations r
    JOIN relation_members rm ON rm.relation_id = r.id
    WHERE rm.user_id = ${user.id}
    ORDER BY r.created_at DESC`;

  const peopleById = new Map();
  const relations = [];
  for (const relation of relationRows) {
    const members = await relationMembers(relation.id);
    const memberIds = members.map(member => {
      if (member.id === user.id) return "me";
      peopleById.set(member.id, publicPerson(member, relation.note || "一起喝"));
      return member.id;
    });
    relations.push({
      id: relation.id,
      note: relation.note || "一起喝",
      status: Number(relation.member_count) > 1 ? "active" : "pending",
      memberIds,
      inviteCode: relation.invite_code,
      receive: relation.receive,
      send: relation.send,
      creator: relation.creator_user_id === user.id
    });
  }

  const incomingRows = await sql`SELECT DISTINCT ON (e.sender_user_id)
      e.id AS event_id, e.sender_user_id AS id, e.created_at, p.name, p.cup_id, p.colors
    FROM drink_targets target
    JOIN drink_events e ON e.id = target.event_id
    LEFT JOIN profiles p ON p.user_id = e.sender_user_id
    WHERE target.recipient_user_id = ${user.id}
      AND target.responded_at IS NULL
      AND e.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY e.sender_user_id, e.created_at DESC
    LIMIT 12`;
  const incomingEvents = {};
  for (const row of incomingRows) {
    peopleById.set(row.id, { ...publicPerson(row), time: timeLabel(row.created_at) });
    incomingEvents[row.id] = row.event_id;
  }

  const responseRows = await sql`SELECT DISTINCT ON (target.recipient_user_id)
      target.recipient_user_id AS id, target.responded_at, p.name, p.cup_id, p.colors
    FROM drink_events event
    JOIN drink_targets target ON target.event_id = event.id
    LEFT JOIN profiles p ON p.user_id = target.recipient_user_id
    WHERE event.sender_user_id = ${user.id}
      AND target.responded_at IS NOT NULL
      AND target.responded_at > NOW() - INTERVAL '30 minutes'
    ORDER BY target.recipient_user_id, target.responded_at DESC
    LIMIT 12`;
  for (const row of responseRows) peopleById.set(row.id, publicPerson(row));

  return {
    ok: true,
    profile,
    relations,
    people: [...peopleById.values()],
    incomingIds: incomingRows.map(row => row.id),
    incomingEvents,
    responseIds: responseRows.map(row => row.id)
  };
}

async function saveProfile(user, body) {
  const sql = database();
  const name = cleanText(body.name, 12);
  const cupId = cleanText(body.cupId, 16);
  const colors = cleanColors(body.colors);
  if (!name || !cupIds.has(cupId) || !colors) return json({ ok: false, message: "杯子资料不完整" }, 400);
  await sql`INSERT INTO profiles (user_id, name, cup_id, colors, updated_at)
    VALUES (${user.id}, ${name}, ${cupId}, ${JSON.stringify(colors)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name, cup_id = EXCLUDED.cup_id, colors = EXCLUDED.colors, updated_at = NOW()`;
  return json(await readState(user));
}

async function createRelation(user, body) {
  const sql = database();
  const note = cleanText(body.note, 24);
  if (!note) return json({ ok: false, message: "给这段关系写个名字" }, 400);
  let inviteCode;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = newInviteCode();
    const existing = await sql`SELECT id FROM relations WHERE invite_code = ${candidate} LIMIT 1`;
    if (!existing.length) { inviteCode = candidate; break; }
  }
  if (!inviteCode) return json({ ok: false, message: "邀请码生成失败，请重试" }, 503);
  const relationId = newId();
  await sql`INSERT INTO relations (id, creator_user_id, invite_code) VALUES (${relationId}, ${user.id}, ${inviteCode})`;
  await sql`INSERT INTO relation_members (relation_id, user_id, note) VALUES (${relationId}, ${user.id}, ${note})`;
  const state = await readState(user);
  return json({ ...state, relationId });
}

async function previewInvite(user, body) {
  const sql = database();
  const code = cleanText(body.code, 10).toUpperCase();
  const rows = await sql`SELECT id, invite_code FROM relations WHERE invite_code = ${code} LIMIT 1`;
  if (!rows.length) return json({ ok: false, message: "这个邀请码不可用" }, 404);
  const members = await relationMembers(rows[0].id);
  if (members.some(member => member.id === user.id)) {
    return json({ ok: false, ownInvite: true, message: "这是你自己的邀请，发给朋友就好" }, 409);
  }
  return json({
    ok: true,
    preview: {
      id: rows[0].id,
      inviteCode: rows[0].invite_code,
      members: members.map(member => publicPerson(member))
    }
  });
}

async function acceptInvite(user, body) {
  const sql = database();
  const code = cleanText(body.code, 10).toUpperCase();
  const rows = await sql`SELECT id FROM relations WHERE invite_code = ${code} LIMIT 1`;
  if (!rows.length) return json({ ok: false, message: "这个邀请码不可用" }, 404);
  const members = await relationMembers(rows[0].id);
  const ownerName = members[0]?.name || "朋友";
  await sql`INSERT INTO relation_members (relation_id, user_id, note)
    VALUES (${rows[0].id}, ${user.id}, ${`和${ownerName}`})
    ON CONFLICT (relation_id, user_id) DO NOTHING`;
  const state = await readState(user);
  return json({ ...state, relationId: rows[0].id });
}

async function updateRelation(user, body) {
  const sql = database();
  const relationId = cleanText(body.relationId, 40);
  const rows = await sql`SELECT note, receive, send FROM relation_members
    WHERE relation_id = ${relationId} AND user_id = ${user.id} LIMIT 1`;
  if (!rows.length) return json({ ok: false, message: "没有找到这段关系" }, 404);
  const note = body.note === undefined ? rows[0].note : cleanText(body.note, 24);
  const receive = typeof body.receive === "boolean" ? body.receive : rows[0].receive;
  const send = typeof body.send === "boolean" ? body.send : rows[0].send;
  if (!note) return json({ ok: false, message: "关系备注不能为空" }, 400);
  await sql`UPDATE relation_members SET note = ${note}, receive = ${receive}, send = ${send}
    WHERE relation_id = ${relationId} AND user_id = ${user.id}`;
  return json(await readState(user));
}

async function removeRelation(user, body) {
  const sql = database();
  const relationId = cleanText(body.relationId, 40);
  const membership = await sql`SELECT r.creator_user_id,
      (SELECT COUNT(*)::INT FROM relation_members members WHERE members.relation_id = r.id) AS member_count
    FROM relations r JOIN relation_members rm ON rm.relation_id = r.id
    WHERE r.id = ${relationId} AND rm.user_id = ${user.id} LIMIT 1`;
  if (!membership.length) return json({ ok: false, message: "没有找到这段关系" }, 404);
  if (membership[0].creator_user_id === user.id && Number(membership[0].member_count) === 1) {
    await sql`DELETE FROM relations WHERE id = ${relationId}`;
  } else {
    await sql`DELETE FROM relation_members WHERE relation_id = ${relationId} AND user_id = ${user.id}`;
    await sql`DELETE FROM relations WHERE id = ${relationId}
      AND NOT EXISTS (SELECT 1 FROM relation_members WHERE relation_id = ${relationId})`;
  }
  return json(await readState(user));
}

async function deleteAccount(user) {
  const sql = database();
  const relationRows = await sql`SELECT relation_id FROM relation_members WHERE user_id = ${user.id}`;
  await sql`DELETE FROM users WHERE id = ${user.id}`;
  for (const relation of relationRows) {
    await sql`DELETE FROM relations WHERE id = ${relation.relation_id}
      AND NOT EXISTS (SELECT 1 FROM relation_members WHERE relation_id = ${relation.relation_id})`;
  }
  return json({ ok: true });
}

async function sendDrink(user, body) {
  const sql = database();
  const requested = Array.isArray(body.recipientIds)
    ? [...new Set(body.recipientIds.map(value => cleanText(value, 40)).filter(Boolean))]
    : [];
  const eligible = await sql`SELECT DISTINCT other.user_id AS id
    FROM relation_members mine
    JOIN relation_members other ON other.relation_id = mine.relation_id
    WHERE mine.user_id = ${user.id} AND mine.send = TRUE
      AND other.user_id <> ${user.id} AND other.receive = TRUE`;
  const eligibleIds = eligible.map(row => row.id);
  const recipientIds = requested.length ? eligibleIds.filter(id => requested.includes(id)) : eligibleIds;
  if (!recipientIds.length) return json({ ok: true, shared: false });
  const eventId = newId();
  await sql`INSERT INTO drink_events (id, sender_user_id) VALUES (${eventId}, ${user.id})`;
  for (const recipientId of recipientIds) {
    await sql`INSERT INTO drink_targets (event_id, recipient_user_id) VALUES (${eventId}, ${recipientId})`;
  }
  return json({ ok: true, shared: true, recipientCount: recipientIds.length });
}

async function respondDrink(user, body) {
  const sql = database();
  const senderIds = Array.isArray(body.senderIds)
    ? [...new Set(body.senderIds.map(value => cleanText(value, 40)).filter(Boolean))]
    : [];
  if (!senderIds.length) return json({ ok: false, message: "没有选择要回应的人" }, 400);
  for (const senderId of senderIds) {
    await sql`UPDATE drink_targets target SET responded_at = NOW()
      FROM drink_events event
      WHERE target.event_id = event.id
        AND target.recipient_user_id = ${user.id}
        AND event.sender_user_id = ${senderId}
        AND target.responded_at IS NULL`;
  }
  return json(await readState(user));
}

export default {
  async fetch(request) {
    if (!new Set(["GET", "POST"]).has(request.method)) return methodNotAllowed();
    const user = sessionFromRequest(request);
    if (!user) return json({ ok: false, message: "登录已失效" }, 401);
    if (!database()) return json({ ok: false, message: "数据库还没有连接好" }, 503);
    try {
      await ensureSchema();
      await ensureUser(user);
      if (request.method === "GET") return json(await readState(user));
      const body = await requestJson(request);
      const handlers = {
        saveProfile,
        createRelation,
        previewInvite,
        acceptInvite,
        updateRelation,
        removeRelation,
        deleteAccount,
        sendDrink,
        respondDrink
      };
      const handler = handlers[body.action];
      if (!handler) return json({ ok: false, message: "未知操作" }, 400);
      return await handler(user, body);
    } catch (error) {
      console.error("app-state", error);
      return json({ ok: false, message: "数据暂时没有同步，请稍后再试" }, 500);
    }
  }
};
