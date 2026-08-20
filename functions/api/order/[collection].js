// PUT /api/order/:collection  { ids: [...] }  -> store the order the client arranged
//
// Sits under /api/order/ rather than /api/:collection/order so it cannot be confused with
// the /api/:collection/:id route that handles delete.
//
// Every page renders its collection in `sort` order and none of them re-sort, so this is the
// only thing that decides what comes first on the public site: the GM at the top of the team
// page, the best photograph first in the gallery. `updated_at` moves too, so a reorder counts
// as an unpublished change like any other edit.
import { COLLECTIONS, json, bad, touchContent } from '../_shared.js';

export async function onRequestPut({ env, request, params }) {
  const collection = params.collection;
  if (!COLLECTIONS.includes(collection)) return bad('unknown collection', 404);
  const body = await request.json();
  const ids = body && body.ids;
  if (!Array.isArray(ids)) return bad('expected { ids: [...] }');
  if (!ids.length) return json({ ok: true, count: 0 });

  const now = Date.now();
  const stmt = env.DB.prepare('UPDATE entries SET sort=?1, updated_at=?2 WHERE collection=?3 AND id=?4');
  await env.DB.batch(ids.map((id, i) => stmt.bind(i, now, collection, String(id))));
  await touchContent(env);
  return json({ ok: true, count: ids.length });
}
