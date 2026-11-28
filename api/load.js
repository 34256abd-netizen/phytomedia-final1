// GET /api/load: the public catalog (mentors and jobs) shared by all visitors.
// Never returns student, booking or account data. Inert ({}) until DATABASE_URL is set.
import { sql, ensureTable } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({});
  if (!process.env.DATABASE_URL) return res.status(200).json({});
  try {
    await ensureTable();
    const rows = await sql("SELECT value FROM kv WHERE key = 'catalog'");
    const v = (rows[0] && rows[0].value) || {};
    return res.status(200).json({
      mentors: Array.isArray(v.mentors) ? v.mentors : undefined,
      jobs: Array.isArray(v.jobs) ? v.jobs : undefined
    });
  } catch (e) {
    return res.status(200).json({});
  }
}
