// Server-side admin login (Vercel serverless function, free tier).
// Secrets live only in Vercel environment variables, never in client code:
//   ADMIN_EMAIL, ADMIN_PASSWORD_HASH (scrypt, "saltHex:hashHex"), ADMIN_TOKEN_SECRET
// If any is missing the endpoint refuses every login (fails closed).
import crypto from 'node:crypto';

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_TOKEN_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !ADMIN_TOKEN_SECRET) {
    return res.status(503).json({ ok: false });
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');
  const [salt, hash] = ADMIN_PASSWORD_HASH.split(':');
  let ok = false;
  try {
    const got = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
    ok = safeEqual(got, hash) && safeEqual(email, ADMIN_EMAIL.trim().toLowerCase());
  } catch (e) { ok = false; }
  if (!ok) return res.status(401).json({ ok: false });
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(String(exp)).digest('hex');
  return res.status(200).json({ ok: true, token: exp + '.' + sig });
}
