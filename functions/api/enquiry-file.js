// GET /api/enquiry-file?e=<enquiryId>          -> what is attached to this enquiry
// GET /api/enquiry-file?f=<fileId>&dl=1        -> download one attachment
//
// Behind the admin session like the rest of /api. A CV is somebody's personal document; it
// is served with no-store and as an attachment, never inline, so it cannot be framed by
// another page or left in a shared cache.
import { json, bad } from './_shared.js';

export async function onRequestGet({ env, request }) {
  const u = new URL(request.url);
  const enquiryId = u.searchParams.get('e');
  const fileId = u.searchParams.get('f');

  if (enquiryId) {
    const rows = await env.DB.prepare(
      'SELECT id,field,filename,mime,size FROM enquiry_files WHERE enquiry_id=? ORDER BY field'
    ).bind(enquiryId).all();
    return json(rows.results || []);
  }

  if (!fileId) return bad('expected ?e=<enquiry> or ?f=<file>');

  const row = await env.DB.prepare('SELECT filename,mime,bytes FROM enquiry_files WHERE id=?')
    .bind(fileId).first();
  if (!row) return json({ error: 'not found' }, 404);

  const bytes = row.bytes instanceof ArrayBuffer ? row.bytes : new Uint8Array(row.bytes);
  // The filename is what the applicant called their own file. Quotes and newlines are
  // stripped so it cannot break out of the Content-Disposition header.
  const safe = String(row.filename || 'attachment').replace(/[^\w. ()\-]+/g, '_').slice(0, 120);
  return new Response(bytes, {
    headers: {
      'content-type': row.mime || 'application/octet-stream',
      'content-disposition': 'attachment; filename="' + safe + '"',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
