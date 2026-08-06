// Root middleware: the single auth gate for the whole backend.
//
// Every /api/* route is closed unless the request carries a valid session cookie, except the
// login and logout endpoints themselves. It fails closed: with SESSION_SECRET unset, nothing
// under /api authorises, so a half-provisioned deploy is locked rather than open. The public
// site, /content and /media/* are untouched (they serve only already-published content).
import { COOKIE, readCookie, verifySession } from './_shared_auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const p = new URL(request.url).pathname;
  const isApi = p === '/api' || p.startsWith('/api/');
  const isOpen = p === '/api/login' || p === '/api/logout' || p === '/api/config';
  if (isApi && !isOpen) {
    const ok = await verifySession(readCookie(request, COOKIE), env.SESSION_SECRET);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
  }
  return next();
}
