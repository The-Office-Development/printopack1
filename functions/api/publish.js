// POST /api/publish  -> copy the current content into the `published` row, then trigger a
// site rebuild via the Cloudflare Pages Deploy Hook. The build reads /content.json, which
// serves that row. Editing is instant and private; this is the step that goes live.
import { json, readAll } from './_shared.js';

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
