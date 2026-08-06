// POST /api/logout -> clears the session cookie. (Open route, per _middleware.js.)
import { sessionCookie } from '../_shared_auth.js';

export function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'Set-Cookie': sessionCookie('', 0) },
  });
}
