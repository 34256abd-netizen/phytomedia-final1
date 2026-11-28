// Shared helpers for the API functions. Files starting with "_" are not routes.
// Env vars (all set in Vercel, never in code): DATABASE_URL (Neon/Postgres), ADMIN_TOKEN_SECRET.
import crypto from 'node:crypto';

export function verifyAdminToken(token) {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const want = crypto.createHmac('sha256', secret).update(String(exp)).digest('hex');
  const a = Buffer.from(sig), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Postgres over Neon's HTTP SQL endpoint: no npm dependency, free tier, no card.
export async function sql(query, params = []) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('no-db');
  const host = new URL(url).host;
  const r = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': url },
    body: JSON.stringify({ query, params })
  });
  if (!r.ok) throw new Error('db-' + r.status);
  return (await r.json()).rows || [];
}

export async function ensureTable() {
  await sql('CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
}
