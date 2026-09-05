import { database, ensureSchema, ensureUser, newId, newInviteCode } from "./_db.mjs";
import { json, methodNotAllowed, requestJson, sessionFromRequest } from "./_auth.mjs";
import { sendPushToUsers } from "./_push.mjs";

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
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "刚刚";
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function latestIso(rows, key) {
  const timestamps = rows
    .map(row => new Date(row[key]).getTime())
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : "";
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

  const memberSettingRows = await sql`SELECT other_user_id AS id, note, receive, send
    FROM member_signal_settings
    WHERE user_id = ${user.id}`;

  const proposalRows = await sql`SELECT proposal.id, proposal.relation_id, proposal.proposer_user_id,
      proposal.candidate_label, proposal.invite_code, proposal.status, proposal.created_at,
      profile.name AS proposer_name, vote.approved AS user_vote,
      (SELECT COUNT(*)::INT FROM relation_members members
        WHERE members.relation_id = proposal.relation_id) AS member_count,
      (SELECT COUNT(*)::INT FROM member_invite_votes votes
        WHERE votes.proposal_id = proposal.id AND votes.approved = TRUE) AS approval_count
    FROM member_invite_proposals proposal
    JOIN relation_members membership ON membership.relation_id = proposal.relation_id
      AND membership.user_id = ${user.id}
    LEFT JOIN profiles profile ON profile.user_id = proposal.proposer_user_id
    LEFT JOIN member_invite_votes vote ON vote.proposal_id = proposal.id
      AND vote.voter_user_id = ${user.id}
    WHERE proposal.status IN ('pending', 'approved', 'rejected')
    ORDER BY proposal.created_at DESC`;

  const incomingRows = await sql`SELECT DISTINCT ON (e.sender_user_id)
      e.id AS event_id, e.sender_user_id AS id, e.created_at, p.name, p.cup_id, p.colors
    FROM drink_targets target
    JOIN drink_events e ON e.id = target.event_id
    LEFT JOIN profiles p ON p.user_id = e.sender_user_id
    WHERE target.recipient_user_id = ${user.id}
      AND target.responded_at IS NULL
      AND e.created_at > NOW() - INTERVAL '45 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM member_signal_settings setting
        WHERE setting.user_id = ${user.id}
          AND setting.other_user_id = e.sender_user_id
          AND setting.receive = FALSE
      )
      AND EXISTS (
        SELECT 1 FROM relation_members mine
        JOIN relation_members sender ON sender.relation_id = mine.relation_id
        WHERE mine.user_id = ${user.id}
          AND sender.user_id = e.sender_user_id
          AND mine.receive = TRUE
          AND sender.send = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM member_signal_settings sender_setting
            WHERE sender_setting.user_id = e.sender_user_id
              AND sender_setting.other_user_id = ${user.id}
              AND sender_setting.send = FALSE
          )
      )
    ORDER BY e.sender_user_id, e.created_at DESC
    LIMIT 12`;
  const incomingEvents = {};
  for (const row of incomingRows) {
    peopleById.set(row.id, { ...publicPerson(row), time: timeLabel(row.created_at) });
    incomingEvents[row.id] = row.event_id;
  }

  const responseRows = await sql`SELECT DISTINCT ON (target.recipient_user_id)
      event.id AS event_id, target.recipient_user_id AS id, target.responded_at, p.name, p.cup_id, p.colors
    FROM drink_events event
    JOIN drink_targets target ON target.event_id = event.id
    LEFT JOIN profiles p ON p.user_id = target.recipient_user_id
    WHERE event.sender_user_id = ${user.id}
      AND target.responded_at IS NOT NULL
      AND target.responded_at > NOW() - INTERVAL '30 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM member_signal_settings setting
        WHERE setting.user_id = ${user.id}
          AND setting.other_user_id = target.recipient_user_id
          AND setting.receive = FALSE
      )
      AND EXISTS (
        SELECT 1 FROM relation_members mine
        JOIN relation_members responder ON responder.relation_id = mine.relation_id
        WHERE mine.user_id = ${user.id}
          AND responder.user_id = target.recipient_user_id
          AND mine.receive = TRUE
          AND responder.send = TRUE
      )
    ORDER BY target.recipient_user_id, target.responded_at DESC
    LIMIT 12`;
  for (const row of responseRows) {
    const incomingTime = peopleById.get(row.id)?.time;
    peopleById.set(row.id, {
      ...publicPerson(row),
      ...(incomingTime ? { time: incomingTime } : {})
    });
  }

  return {
    ok: true,
    profile,
    relations,
    memberSettings: memberSettingRows.map(row => ({
      id: row.id,
      note: row.note || "",
      receive: row.receive,
      send: row.send
    })),
    proposals: proposalRows.map(row => ({
      id: row.id,
      relationId: row.relation_id,
      proposerId: row.proposer_user_id === user.id ? "me" : row.proposer_user_id,
      proposerName: row.proposer_user_id === user.id ? (profile?.name || "我") : (row.proposer_name || "朋友"),
      candidateLabel: row.candidate_label,
      status: row.status,
      inviteCode: row.status === "approved" ? row.invite_code : "",
      userVote: typeof row.user_vote === "boolean" ? row.user_vote : null,
      approvalCount: Number(row.approval_count || 0),
      memberCount: Number(row.member_count || 0),
      createdAt: new Date(row.created_at).toISOString()
    })),
    people: [...peopleById.values()],
    incomingIds: incomingRows.map(row => row.id),
    incomingEvents,
    incomingLatestAt: latestIso(incomingRows, "created_at"),
    responseIds: responseRows.map(row => row.id),
    responseLatestAt: latestIso(responseRows, "responded_at"),
    responseSignature: responseRows
      .map(row => `${row.event_id}:${row.id}:${new Date(row.responded_at).toISOString()}`)
      .sort()
      .join("|")
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

async function uniqueInviteCode(sql) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = newInviteCode();
    const relationMatches = await sql`SELECT id FROM relations WHERE invite_code = ${candidate} LIMIT 1`;
    const proposalMatches = await sql`SELECT id FROM member_invite_proposals WHERE invite_code = ${candidate} LIMIT 1`;
    if (!relationMatches.length && !proposalMatches.length) return candidate;
  }
  return "";
}

async function resolveInvite(sql, code) {
  const proposalRows = await sql`SELECT proposal.id AS proposal_id, proposal.relation_id,
      proposal.invite_code, proposal.candidate_label
    FROM member_invite_proposals proposal
    WHERE proposal.invite_code = ${code} AND proposal.status = 'approved'
    LIMIT 1`;
  if (proposalRows.length) return proposalRows[0];

  const relationRows = await sql`SELECT relation.id AS relation_id, relation.invite_code,
      (SELECT COUNT(*)::INT FROM relation_members members
        WHERE members.relation_id = relation.id) AS member_count
    FROM relations relation
    WHERE relation.invite_code = ${code}
    LIMIT 1`;
  if (!relationRows.length || Number(relationRows[0].member_count) > 1) return null;
  return { ...relationRows[0], proposal_id: null, candidate_label: "" };
}

async function createRelation(user, body) {
  const sql = database();
  const note = cleanText(body.note, 24);
  if (!note) return json({ ok: false, message: "给这段关系写个名字" }, 400);
  const inviteCode = await uniqueInviteCode(sql);
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
  const invite = await resolveInvite(sql, code);
  if (!invite) return json({ ok: false, message: "这个邀请码不可用，可能还在等待大家确认" }, 404);
  const members = await relationMembers(invite.relation_id);
  if (members.some(member => member.id === user.id)) {
    return json({ ok: false, ownInvite: true, message: "这是你自己的邀请，发给朋友就好" }, 409);
  }
  return json({
    ok: true,
    preview: {
      id: invite.relation_id,
      proposalId: invite.proposal_id,
      candidateLabel: invite.candidate_label,
      inviteCode: invite.invite_code,
      members: members.map(member => publicPerson(member))
    }
  });
}

async function acceptInvite(user, body) {
  const sql = database();
  const code = cleanText(body.code, 10).toUpperCase();
  const invite = await resolveInvite(sql, code);
  if (!invite) return json({ ok: false, message: "这个邀请码不可用，可能还在等待大家确认" }, 404);
  const members = await relationMembers(invite.relation_id);
  const ownerName = members[0]?.name || "朋友";
  const joined = await sql`INSERT INTO relation_members (relation_id, user_id, note)
    VALUES (${invite.relation_id}, ${user.id}, ${`和${ownerName}`})
    ON CONFLICT (relation_id, user_id) DO NOTHING
    RETURNING relation_id`;
  if (joined.length && invite.proposal_id) {
    await sql`UPDATE member_invite_proposals SET status = 'accepted', updated_at = NOW()
      WHERE id = ${invite.proposal_id} AND status = 'approved'`;
  }
  if (joined.length) {
    const joinedProfile = await profileFor(user.id);
    await sendPushToUsers(
      members.map(member => member.id),
      "relation",
      {
        title: "新朋友到位",
        body: `${joinedProfile?.name || "朋友"}加入了你们。`,
        tag: `relation-${invite.relation_id}`,
        url: "/?from=relation-notification"
      }
    );
  }
  const state = await readState(user);
  return json({ ...state, relationId: invite.relation_id });
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

async function updateMemberSettings(user, body) {
  const sql = database();
  const memberId = cleanText(body.memberId, 40);
  if (!memberId || memberId === user.id) return json({ ok: false, message: "没有找到这位成员" }, 400);
  const shared = await sql`SELECT 1
    FROM relation_members mine
    JOIN relation_members other ON other.relation_id = mine.relation_id
    WHERE mine.user_id = ${user.id} AND other.user_id = ${memberId}
    LIMIT 1`;
  if (!shared.length) return json({ ok: false, message: "你们已经不在同一段关系里" }, 404);
  const note = cleanText(body.note, 12);
  const receive = body.receive !== false;
  const send = body.send !== false;
  await sql`INSERT INTO member_signal_settings (user_id, other_user_id, note, receive, send, updated_at)
    VALUES (${user.id}, ${memberId}, ${note}, ${receive}, ${send}, NOW())
    ON CONFLICT (user_id, other_user_id) DO UPDATE SET
      note = EXCLUDED.note,
      receive = EXCLUDED.receive,
      send = EXCLUDED.send,
      updated_at = NOW()`;
  return json(await readState(user));
}

async function createMemberProposal(user, body) {
  const sql = database();
  const relationId = cleanText(body.relationId, 40);
  const candidateLabel = cleanText(body.candidateLabel, 12);
  if (!candidateLabel) return json({ ok: false, message: "先写下朋友的称呼" }, 400);
  const membership = await sql`SELECT 1 FROM relation_members
    WHERE relation_id = ${relationId} AND user_id = ${user.id} LIMIT 1`;
  if (!membership.length) return json({ ok: false, message: "没有找到这段关系" }, 404);
  const existing = await sql`SELECT id, status FROM member_invite_proposals
    WHERE relation_id = ${relationId} AND proposer_user_id = ${user.id}
      AND LOWER(candidate_label) = LOWER(${candidateLabel})
      AND status IN ('pending', 'approved')
    ORDER BY created_at DESC LIMIT 1`;
  if (existing.length) {
    const state = await readState(user);
    return json({ ...state, proposalId: existing[0].id });
  }

  const proposalId = newId();
  await sql`INSERT INTO member_invite_proposals
      (id, relation_id, proposer_user_id, candidate_label, status)
    VALUES (${proposalId}, ${relationId}, ${user.id}, ${candidateLabel}, 'pending')`;
  await sql`INSERT INTO member_invite_votes (proposal_id, voter_user_id, approved)
    VALUES (${proposalId}, ${user.id}, TRUE)`;

  const members = await relationMembers(relationId);
  if (members.length <= 1) {
    const inviteCode = await uniqueInviteCode(sql);
    if (!inviteCode) return json({ ok: false, message: "邀请码生成失败，请重试" }, 503);
    await sql`UPDATE member_invite_proposals
      SET status = 'approved', invite_code = ${inviteCode}, updated_at = NOW()
      WHERE id = ${proposalId}`;
  } else {
    const proposer = await profileFor(user.id);
    await sendPushToUsers(
      members.map(member => member.id).filter(id => id !== user.id),
      "relation",
      {
        title: "有一份新邀请",
        body: `${proposer?.name || "朋友"}想叫上${candidateLabel}。`,
        tag: `proposal-${proposalId}`,
        url: `/?from=proposal&proposal=${proposalId}`
      }
    );
  }
  const state = await readState(user);
  return json({ ...state, proposalId });
}

async function voteMemberProposal(user, body) {
  const sql = database();
  const proposalId = cleanText(body.proposalId, 40);
  const approved = body.approved === true;
  const proposalRows = await sql`SELECT proposal.id, proposal.relation_id, proposal.proposer_user_id,
      proposal.candidate_label, proposal.status
    FROM member_invite_proposals proposal
    JOIN relation_members membership ON membership.relation_id = proposal.relation_id
      AND membership.user_id = ${user.id}
    WHERE proposal.id = ${proposalId}
    LIMIT 1`;
  if (!proposalRows.length) return json({ ok: false, message: "这份邀请已经不存在" }, 404);
  const proposal = proposalRows[0];
  if (proposal.status !== "pending") return json(await readState(user));

  await sql`INSERT INTO member_invite_votes (proposal_id, voter_user_id, approved, voted_at)
    VALUES (${proposalId}, ${user.id}, ${approved}, NOW())
    ON CONFLICT (proposal_id, voter_user_id) DO UPDATE SET
      approved = EXCLUDED.approved,
      voted_at = NOW()`;

  let nextStatus = "pending";
  if (!approved) {
    nextStatus = "rejected";
    await sql`UPDATE member_invite_proposals SET status = 'rejected', updated_at = NOW()
      WHERE id = ${proposalId} AND status = 'pending'`;
  } else {
    const counts = await sql`SELECT
        (SELECT COUNT(*)::INT FROM relation_members members
          WHERE members.relation_id = ${proposal.relation_id}) AS member_count,
        (SELECT COUNT(*)::INT FROM member_invite_votes votes
          JOIN relation_members members ON members.relation_id = ${proposal.relation_id}
            AND members.user_id = votes.voter_user_id
          WHERE votes.proposal_id = ${proposalId} AND votes.approved = TRUE) AS approval_count`;
    if (Number(counts[0]?.member_count || 0) === Number(counts[0]?.approval_count || 0)) {
      const inviteCode = await uniqueInviteCode(sql);
      if (!inviteCode) return json({ ok: false, message: "邀请码生成失败，请重试" }, 503);
      nextStatus = "approved";
      await sql`UPDATE member_invite_proposals
        SET status = 'approved', invite_code = ${inviteCode}, updated_at = NOW()
        WHERE id = ${proposalId} AND status = 'pending'`;
    }
  }

  if (nextStatus !== "pending") {
    await sendPushToUsers([proposal.proposer_user_id], "relation", {
      title: nextStatus === "approved" ? "邀请可以发出了" : "这次邀请没有继续",
      body: nextStatus === "approved"
        ? `大家都同意叫上${proposal.candidate_label}。`
        : `关于${proposal.candidate_label}的邀请已结束。`,
      tag: `proposal-result-${proposalId}`,
      url: `/?from=proposal-result&proposal=${proposalId}`
    });
  }
  return json(await readState(user));
}

async function withdrawMemberProposal(user, body) {
  const sql = database();
  const proposalId = cleanText(body.proposalId, 40);
  const rows = await sql`UPDATE member_invite_proposals
    SET status = 'withdrawn', invite_code = NULL, updated_at = NOW()
    WHERE id = ${proposalId} AND proposer_user_id = ${user.id}
      AND status IN ('pending', 'approved', 'rejected')
    RETURNING relation_id`;
  if (!rows.length) return json({ ok: false, message: "这份邀请已经不能撤回" }, 409);
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
      AND other.user_id <> ${user.id} AND other.receive = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM member_signal_settings mine_setting
        WHERE mine_setting.user_id = ${user.id}
          AND mine_setting.other_user_id = other.user_id
          AND mine_setting.send = FALSE
      )
      AND NOT EXISTS (
        SELECT 1 FROM member_signal_settings other_setting
        WHERE other_setting.user_id = other.user_id
          AND other_setting.other_user_id = ${user.id}
          AND other_setting.receive = FALSE
      )`;
  const eligibleIds = eligible.map(row => row.id);
  const recipientIds = requested.length ? eligibleIds.filter(id => requested.includes(id)) : eligibleIds;
  if (!recipientIds.length) return json({ ok: true, shared: false });
  const eventId = newId();
  await sql`INSERT INTO drink_events (id, sender_user_id) VALUES (${eventId}, ${user.id})`;
  for (const recipientId of recipientIds) {
    await sql`INSERT INTO drink_targets (event_id, recipient_user_id) VALUES (${eventId}, ${recipientId})`;
  }
  const senderProfile = await profileFor(user.id);
  await sendPushToUsers(recipientIds, "drink", {
    title: "要不要跟一口？",
    body: `${senderProfile?.name || "朋友"}刚喝了一口。`,
    tag: `drink-${eventId}`,
    url: `/?from=drink-notification&event=${eventId}`
  });
  return json({ ok: true, shared: true, recipientCount: recipientIds.length });
}

async function respondDrink(user, body) {
  const sql = database();
  const senderIds = Array.isArray(body.senderIds)
    ? [...new Set(body.senderIds.map(value => cleanText(value, 40)).filter(Boolean))]
    : [];
  if (!senderIds.length) return json({ ok: false, message: "没有选择要回应的人" }, 400);
  const respondedSenderIds = [];
  for (const senderId of senderIds) {
    const updated = await sql`UPDATE drink_targets target SET responded_at = NOW()
      FROM drink_events event
      WHERE target.event_id = event.id
        AND target.recipient_user_id = ${user.id}
        AND event.sender_user_id = ${senderId}
        AND target.responded_at IS NULL
        AND event.created_at > NOW() - INTERVAL '45 minutes'
      RETURNING target.event_id`;
    if (updated.length) respondedSenderIds.push(senderId);
  }
  const responderProfile = await profileFor(user.id);
  await sendPushToUsers(respondedSenderIds, "response", {
    title: "碰到了",
    body: `${responderProfile?.name || "朋友"}跟了你一口。`,
    tag: `response-${user.id}`,
    url: "/?from=response-notification"
  });
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
        updateMemberSettings,
        createMemberProposal,
        voteMemberProposal,
        withdrawMemberProposal,
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
