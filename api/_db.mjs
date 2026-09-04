import { createHash, randomInt, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const inviteAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
let databaseClient;
let schemaPromise;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function database() {
  if (!databaseConfigured()) return null;
  databaseClient ||= neon(process.env.DATABASE_URL);
  return databaseClient;
}

export async function ensureSchema() {
  const sql = database();
  if (!sql) return false;
  schemaPromise ||= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(12) NOT NULL,
      cup_id VARCHAR(16) NOT NULL,
      colors JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS relations (
      id UUID PRIMARY KEY,
      creator_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      invite_code VARCHAR(10) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS relation_members (
      relation_id UUID NOT NULL REFERENCES relations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note VARCHAR(24) NOT NULL DEFAULT '',
      receive BOOLEAN NOT NULL DEFAULT TRUE,
      send BOOLEAN NOT NULL DEFAULT TRUE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (relation_id, user_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS drink_events (
      id UUID PRIMARY KEY,
      sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS drink_targets (
      event_id UUID NOT NULL REFERENCES drink_events(id) ON DELETE CASCADE,
      recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      responded_at TIMESTAMPTZ,
      PRIMARY KEY (event_id, recipient_user_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS email_send_limits (
      email_hash TEXT PRIMARY KEY,
      last_sent_at TIMESTAMPTZ NOT NULL,
      window_started_at TIMESTAMPTZ NOT NULL,
      send_count INTEGER NOT NULL DEFAULT 1
    )`;
    await sql`CREATE INDEX IF NOT EXISTS relation_members_user_idx ON relation_members(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS drink_targets_recipient_idx ON drink_targets(recipient_user_id, responded_at)`;
    await sql`CREATE INDEX IF NOT EXISTS drink_events_sender_idx ON drink_events(sender_user_id, created_at DESC)`;
    return true;
  })().catch(error => {
    schemaPromise = undefined;
    throw error;
  });
  return schemaPromise;
}

export async function allowVerificationEmail(email) {
  const sql = database();
  if (!sql) return { allowed: true, retryAfterSeconds: 0 };
  await ensureSchema();
  const emailHash = createHash("sha256").update(email).digest("hex");
  const rows = await sql`INSERT INTO email_send_limits (email_hash, last_sent_at, window_started_at, send_count)
    VALUES (${emailHash}, NOW(), NOW(), 1)
    ON CONFLICT (email_hash) DO UPDATE SET
      last_sent_at = NOW(),
      window_started_at = CASE
        WHEN email_send_limits.window_started_at <= NOW() - INTERVAL '1 hour' THEN NOW()
        ELSE email_send_limits.window_started_at
      END,
      send_count = CASE
        WHEN email_send_limits.window_started_at <= NOW() - INTERVAL '1 hour' THEN 1
        ELSE email_send_limits.send_count + 1
      END
    WHERE email_send_limits.last_sent_at <= NOW() - INTERVAL '60 seconds'
      AND (email_send_limits.window_started_at <= NOW() - INTERVAL '1 hour' OR email_send_limits.send_count < 10)
    RETURNING last_sent_at`;
  return { allowed: rows.length > 0, retryAfterSeconds: rows.length ? 0 : 60 };
}

export async function ensureUser(user) {
  const sql = database();
  if (!sql) return { configured: false, hasProfile: false };
  await ensureSchema();
  await sql`INSERT INTO users (id, email, created_at)
    VALUES (${user.id}, ${user.email}, ${user.createdAt || new Date().toISOString()})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`;
  const profiles = await sql`SELECT user_id FROM profiles WHERE user_id = ${user.id} LIMIT 1`;
  return { configured: true, hasProfile: profiles.length > 0 };
}

export function newId() {
  return randomUUID();
}

export function newInviteCode(length = 6) {
  return Array.from({ length }, () => inviteAlphabet[randomInt(inviteAlphabet.length)]).join("");
}
