// POST /api/login  { password }  -> sets the signed session cookie on success.
// The one account is the marketing department's; there is no username to enumerate, only the
// shared password, checked against the current hash (D1 auth row, else the bootstrap secret).
// Because it is a single shared password, this route also rate-limits failures per client IP
// (login_guard), so it cannot be guessed by scripting attempts.
import { verifyPassword, issueSession, sessionCookie, currentHash } from '../_shared_auth.js';

const MAX_FAILS = 8;                    // failures from one IP before it is locked out
const LOCK_MS = 15 * 60 * 1000;         // how long the lockout lasts

export async function onRequestPost({ request, env }) {
  const hash = await currentHash(env);
  if (!env.SESSION_SECRET || !hash) {
    return json({ error: 'login not configured' }, 500);
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const now = Date.now();

  let body = {};
  try { body = await request.json(); } catch (e) {}

  // Bot wall (only when configured). A failed check is a bot, not a password guess, so it is
  // rejected before the lockout counter is touched.
  if (env.TURNSTILE_SECRET) {
    const passed = await verifyTurnstile(env.TURNSTILE_SECRET, body && body.turnstileToken, ip);
    if (!passed) return json({ error: 'Verification failed. Please try again.' }, 403);
  }

  const guard = await env.DB.prepare('SELECT fails,locked_until FROM login_guard WHERE ip=?').bind(ip).first();
  if (guard && guard.locked_until > now) {
    const retry = Math.ceil((guard.locked_until - now) / 1000);
    return json({ error: 'Too many attempts. Please wait before trying again.' }, 429, { 'Retry-After': String(retry) });
  }

  const ok = await verifyPassword(body && body.password, hash);

  if (!ok) {
    await new Promise((r) => setTimeout(r, 400)); // blunt rapid guessing
    // A prior lock that has since expired resets the counter; otherwise keep counting.
    const expiredLock = guard && guard.locked_until > 0 && guard.locked_until <= now;
    const base = !guard || expiredLock ? 0 : guard.fails;
    let fails = base + 1;
    let lockedUntil = 0;
    if (fails >= MAX_FAILS) { lockedUntil = now + LOCK_MS; fails = 0; }
    await env.DB.prepare(
      'INSERT INTO login_guard (ip,fails,locked_until,updated_at) VALUES (?1,?2,?3,?4) ' +
      'ON CONFLICT(ip) DO UPDATE SET fails=?2, locked_until=?3, updated_at=?4'
    ).bind(ip, fails, lockedUntil, now).run();
    return json({ error: 'invalid password' }, lockedUntil ? 429 : 401);
  }

  if (guard) await env.DB.prepare('DELETE FROM login_guard WHERE ip=?').bind(ip).run();
  const token = await issueSession(env.SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': sessionCookie(token) },
  });
}

export const onRequestGet = () => json({ error: 'method not allowed' }, 405);

// Cloudflare Turnstile server check. Called only when TURNSTILE_SECRET is set; a missing or
// rejected token means "not a human", so we fail closed (return false) and the caller 403s.
async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip && ip !== 'local') form.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const o = await r.json();
    return !!o.success;
  } catch (e) {
    return false;
  }
}

function json(data, status, extra) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, extra || {}),
  });
}
