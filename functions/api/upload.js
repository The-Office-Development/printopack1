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

const MAX_BYTES = 600 * 1024; // the admin targets 400 KB; this is the hard ceiling
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' };

export async function onRequestPost({ env, request }) {
  const { dataUrl } = await request.json();
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return bad('expected a base64 data URL');
  const mime = m[1];
  // Only real raster pictures. SVG is refused because it can carry script and would be
  // served from the site's own origin; video never belongs here at all.
  if (!EXT[mime]) return bad('unsupported image type: ' + mime);
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  if (bytes.length > MAX_BYTES) return bad('image is too large: ' + Math.round(bytes.length / 1024) + ' KB');

  const key = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '.' + EXT[mime];
  await env.DB.prepare('INSERT INTO media (key,mime,bytes,size,updated_at) VALUES (?1,?2,?3,?4,?5)')
    .bind(key, mime, bytes, bytes.length, Date.now())
    .run();
  // The record stores the path the built site will serve, not a storage URL, so nothing in
  // the content depends on where the bytes happen to live today.
  return json({ url: '/uploads/' + key, key });
}
