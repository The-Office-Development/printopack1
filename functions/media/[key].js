// GET /media/:key  -> one uploaded picture, straight out of D1.
//
// Two callers, both of them rare:
//   1. the Pages build, which downloads every picture once and writes it into /uploads/ so
//      that visitors are served static files from the CDN;
//   2. the admin, previewing a picture that has been uploaded but not published yet, since
//      /uploads/<key> does not exist until the next build.
//
// Public visitors never reach this route, which is the point: static assets are unmetered,
// while every request here would count against the free plan's daily function quota.
export async function onRequestGet({ env, params }) {
  const key = String(params.key || '');
  const row = await env.DB.prepare('SELECT mime,bytes FROM media WHERE key=?').bind(key).first();
  if (!row) return new Response('not found', { status: 404 });
  // D1 hands a BLOB back as a plain array of byte values, which Response would happily
  // serialise as the text "137,80,78,71,...". It has to be wrapped before it is sent.
  const bytes = row.bytes instanceof ArrayBuffer ? row.bytes : new Uint8Array(row.bytes);
  return new Response(bytes, {
    headers: {
      'content-type': row.mime,
      // The key is unique per upload and a picture is never rewritten under the same key.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
