// GET  /api/publish  -> is anything edited but not yet live, and when was the last publish
// POST /api/publish  -> copy the current content into the `published` row, then trigger a
// site rebuild via the Cloudflare Pages Deploy Hook. The build reads /content, which serves
// that row. Editing is instant and private; this is the step that goes live.
import { json, readAll } from './_shared.js';

// The admin asks this on load so it can tell the client, plainly, whether what they are
// looking at is what the public sees. "Saved" and "live" are different things here, and the
// dashboard should never let that be ambiguous.
export async function onRequestGet({ env }) {
  const pub = await env.DB.prepare('SELECT updated_at FROM published WHERE key=?').bind('content').first();
  const edit = await env.DB.prepare(
    'SELECT MAX(t) AS t FROM (SELECT MAX(updated_at) AS t FROM entries UNION ALL SELECT MAX(updated_at) FROM singletons)'
  ).first();
  const publishedAt = pub ? pub.updated_at : null;
  const editedAt = edit ? edit.t : null;
  return json({
    publishedAt,
    editedAt,
    // Never published at all still counts as pending, as long as there is something to publish.
    pending: editedAt != null && (publishedAt == null || editedAt > publishedAt),
    // Without the deploy hook a publish saves the snapshot but nothing rebuilds, and the
    // client would be left believing the site had updated.
    canDeploy: Boolean(env.DEPLOY_HOOK_URL),
  });
}

export async function onRequestPost({ env }) {
  const snapshot = { ...(await readAll(env)), publishedAt: Date.now() };
  await env.DB.prepare(
    'INSERT INTO published (key,data,updated_at) VALUES (?1,?2,?3) ' +
    'ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at'
  ).bind('content', JSON.stringify(snapshot), Date.now()).run();

  let deployed = false;
  if (env.DEPLOY_HOOK_URL) {
    try { await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' }); deployed = true; } catch (e) { /* reported below */ }
  }
  return json({ ok: true, deployed });
}
