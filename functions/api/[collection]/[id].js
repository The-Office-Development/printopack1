// DELETE /api/:collection/:id  -> remove a record
import { COLLECTIONS, json, bad, touchContent } from '../_shared.js';

export async function onRequestDelete({ env, params }) {
  if (!COLLECTIONS.includes(params.collection)) return bad('unknown collection', 404);
  await env.DB.prepare('DELETE FROM entries WHERE collection=? AND id=?')
    .bind(params.collection, params.id).run();
  await touchContent(env);
  return json({ ok: true });
}
