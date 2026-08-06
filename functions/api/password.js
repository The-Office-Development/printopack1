// POST /api/password  { current, next }  -> rotate the admin password.
// Gated by _middleware.js (a valid session is required), and the current password is checked
// again here so a walked-away session cannot silently change it. The new hash is written to
// D1, so from now on it, not the ADMIN_PASS_HASH secret, is the password in force.
import { verifyPassword, hashPassword, currentHash } from '../_shared_auth.js';

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const current = body && body.current;
  const next = body && body.next;
  if (!next || String(next).length < 10) {
    return json({ error: 'New password must be at least 10 characters.' }, 400);
  }
  const stored = await currentHash(env);
  if (!(await verifyPassword(current, stored))) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: 'Current password is incorrect.' }, 401);
  }
  const hash = await hashPassword(next);
  await env.DB.prepare(
    "INSERT INTO auth (key,value,updated_at) VALUES ('pass_hash',?1,?2) " +
    'ON CONFLICT(key) DO UPDATE SET value=?1, updated_at=?2'
  ).bind(hash, Date.now()).run();
  return json({ ok: true });
}

function json(data, status) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
