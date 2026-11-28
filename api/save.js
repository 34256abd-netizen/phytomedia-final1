// POST /api/save: admin-only. Stores the public catalog (mentors and jobs).
// Requires "Authorization: Bearer <token from /api/admin-login>". Fails closed.
import { sql, ensureTable, verifyAdminToken } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!process.env.DATABASE_URL || !process.env.ADMIN_TOKEN_SECRET) return res.status(503).json({ ok: false });
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ') || !verifyAdminToken(auth.slice(7))) return res.status(401).json({ ok: false });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || !Array.isArray(body.mentors) || !Array.isArray(body.jobs)) return res.status(400).json({ ok: false });
  const value = JSON.stringify({ mentors: body.mentors, jobs: body.jobs });
  if (value.length > 400000) return res.status(413).json({ ok: false });
  try {
    await ensureTable();
    await sql("INSERT INTO kv (key, value) VALUES ('catalog', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()", [value]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
}
