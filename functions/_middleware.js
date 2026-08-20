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
  // /api/enquiry is the public forms endpoint: the visitor sending it has no login, and
  // never will. It is the only open write on the site, so it carries its own defences (a
  // honeypot, a per-IP throttle, size and type limits) inside the handler.
  // /api/sync/* is the messaging tool reaching in from its own Cloudflare account. It carries
  // its own shared-secret check (see that handler) rather than a session, because the caller
  // is a machine on a cron and there is nobody signed in.
  const isOpen = p === '/api/login' || p === '/api/logout' || p === '/api/config' || p === '/api/enquiry'
    || p.startsWith('/api/sync/');
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
