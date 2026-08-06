// POST /api/upload  { field, dataUrl }  -> stores the picture in D1, returns { url }
//
// No object storage and no payment method on the account: the image goes into the `media`
// table and the build later writes it out as a static file. The admin has already resized
// and re-encoded it in the browser, so what arrives is a small WebP/JPEG, but this is the
// boundary with a browser, so the type and size are enforced here too rather than trusted.
//
// The bytes must go in as a bound parameter: D1 caps a single SQL statement at 100 KB, so an
// image inlined as a literal would fail, while a bound BLOB is allowed up to 2 MB.
import { json, bad } from './_shared.js';

// The client sets the picture limit in Settings > Pictures, and the browser compresses to it.
// A browser can be bypassed, so the same limit is applied again here, read from the same
// setting rather than duplicated as a second number that could drift away from it.
const FLOOR_KB = 40, CEIL_KB = 600, DEFAULT_KB = 400;
// The browser re-encodes every picture to WebP (or JPEG where WebP export is unavailable), so
// those are the only two types that ever legitimately arrive. This is the security boundary, so
// the allowlist is enforced again rather than trusted: anything else (PNG/GIF/SVG/HEIC/etc.) is
// refused, which keeps the served site to a single, fast, predictable image format.
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg' };

async function maxBytes(env) {
  try {
    const row = await env.DB.prepare("SELECT data FROM singletons WHERE key='settings'").first();
    const kb = parseInt(JSON.parse(row?.data || '{}').maxImageKb, 10);
    if (Number.isFinite(kb) && kb > 0) return Math.min(CEIL_KB, Math.max(FLOOR_KB, kb)) * 1024;
  } catch { /* fall through to the default if settings are unreadable */ }
  return DEFAULT_KB * 1024;
}

export async function onRequestPost({ env, request }) {
  const { dataUrl } = await request.json();
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return bad('expected a base64 data URL');
  const mime = m[1];
  // Only real raster pictures. SVG is refused because it can carry script and would be
  // served from the site's own origin; video never belongs here at all.
  if (!EXT[mime]) return bad('unsupported image type: ' + mime);
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  const limit = await maxBytes(env);
  if (bytes.length > limit) {
    return bad('image is too large: ' + Math.round(bytes.length / 1024) +
               ' KB, limit is ' + Math.round(limit / 1024) + ' KB');
  }

  const key = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '.' + EXT[mime];
  await env.DB.prepare('INSERT INTO media (key,mime,bytes,size,updated_at) VALUES (?1,?2,?3,?4,?5)')
    .bind(key, mime, bytes, bytes.length, Date.now())
    .run();
  // The record stores the path the built site will serve, not a storage URL, so nothing in
  // the content depends on where the bytes happen to live today.
  return json({ url: '/uploads/' + key, key });
}
