// GET /api/config -> public, unauthenticated. Tells the login screen whether Turnstile is on
// and what site key to render. The site key is public by design (it ships in the page); the
// secret key never leaves the server. If no key is configured, the login screen skips Turnstile.
export function onRequestGet({ env }) {
  return new Response(JSON.stringify({ turnstile: env.TURNSTILE_SITE_KEY || null }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
