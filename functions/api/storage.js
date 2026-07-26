// GET /api/storage -> how much of the free database the uploaded pictures are using.
//
// The client needs to be able to see this without asking anyone: D1's free plan allows a
// 500 MB database, and pictures are the only thing here that grows without bound. Surfaced
// on the admin dashboard so a problem is visible years before it becomes one.
import { json } from './_shared.js';

const LIMIT_BYTES = 500 * 1024 * 1024; // D1 free plan: 500 MB per database

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(size),0) AS b FROM media').first();
  return json({ count: row.n, bytes: row.b, limit: LIMIT_BYTES });
}
