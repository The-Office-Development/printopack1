// GET /content  -> the published content snapshot, as JSON.
//
// Deliberately outside /api: /api/* is the admin's own gated area, and this has to be
// readable without a login because the Pages build fetches it (a build has no session and
// no database binding). Nothing private is exposed. This is the content that is about to
// be printed into public HTML anyway, and only the *published* snapshot is served, never
// the draft the client is still editing.
//
// Before the first Publish there is no snapshot; 404 is the honest answer, and the build
// falls back to the committed db/seed.json.
export async function onRequestGet({ env }) {
  const row = await env.DB.prepare('SELECT data FROM published WHERE key=?').bind('content').first();
  if (!row) return new Response(JSON.stringify({ error: 'nothing published yet' }), {
    status: 404, headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  return new Response(row.data, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // The build wants the current snapshot, not yesterday's.
      'cache-control': 'no-store',
    },
  });
}
