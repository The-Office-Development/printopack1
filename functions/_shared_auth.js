// Self-hosted admin auth for Printopack (Cloudflare Pages Functions).
//
// Cloudflare Access / Zero Trust was ruled out: its free tier asks for a payment card on file,
// and the client is promised no card and no fees, ever. So the single marketing-department
// login lives here instead: a password checked against a PBKDF2 hash held in the
// ADMIN_PASS_HASH secret, and an HMAC-signed, HttpOnly session cookie signed with
// SESSION_SECRET. Underscore-prefixed files are importable but never routed by Pages.

export const COOKIE = 'pp_session';
export const SESSION_TTL = 60 * 60 * 12; // 12 hours

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Constant-time string compare, so a valid signature or hash cannot be found byte by byte.
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

// Session token = "<exp-epoch-seconds>.<hmac(exp)>". Stateless: no server-side session store.
export async function issueSession(secret) {
  if (!secret) throw new Error('SESSION_SECRET not set');
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  return exp + '.' + (await hmac(secret, String(exp)));
}
export async function verifySession(token, secret) {
  if (!token || !secret) return false;
  const i = token.indexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const exp = parseInt(payload, 10);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false;
  return timingSafeEqual(sig, await hmac(secret, payload));
}

export function readCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  const m = h.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
export function sessionCookie(token, maxAge) {
  return [
    COOKIE + '=' + token,
    'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict',
    'Max-Age=' + (maxAge == null ? SESSION_TTL : maxAge),
  ].join('; ');
}

// Cloudflare Workers' Web Crypto caps PBKDF2 at 100,000 iterations and throws above it, so this
// is the ceiling rather than OWASP's higher figure. It is the iteration count baked into every
// new hash; verifyPassword reads each stored hash's own count, so old hashes keep working.
const PBKDF2_ITER = 100000;

// Verify a password against a stored PBKDF2 hash: "pbkdf2$<iterations>$<saltB64url>$<hashB64url>".
export async function verifyPassword(password, stored) {
  if (!password || !stored) return false;
  const parts = String(stored).split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  if (!iterations) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64url(parts[2]), iterations, hash: 'SHA-256' }, key, 256);
  return timingSafeEqual(b64url(new Uint8Array(bits)), parts[3]);
}

// Produce a fresh stored hash for a new password (used by the in-app change-password route).
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2$' + PBKDF2_ITER + '$' + b64url(salt) + '$' + b64url(new Uint8Array(bits));
}

// The password hash in force now: the D1 'auth' row if the client has ever changed it, else
// the ADMIN_PASS_HASH secret (the initial bootstrap password). This is what makes the password
// rotatable from the dashboard without touching a Pages secret.
export async function currentHash(env) {
  try {
    const row = await env.DB.prepare("SELECT value FROM auth WHERE key='pass_hash'").first();
    if (row && row.value) return row.value;
  } catch (e) { /* auth table may not exist yet: fall back to the secret */ }
  return env.ADMIN_PASS_HASH || null;
}
