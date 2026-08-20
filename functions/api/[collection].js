// GET  /api/:collection      -> list records
// POST /api/:collection      -> create or update a record (upsert by id)
import { COLLECTIONS, json, bad, uid, touchContent } from './_shared.js';

export async function onRequestGet({ env, params }) {
  if (!COLLECTIONS.includes(params.collection)) return bad('unknown collection', 404);
  const rows = await env.DB
    .prepare('SELECT data FROM entries WHERE collection=? ORDER BY sort, updated_at DESC')
    .bind(params.collection).all();
  return json(rows.results.map((r) => JSON.parse(r.data)));
}

export async function onRequestPost({ env, params, request }) {
  const collection = params.collection;
  if (!COLLECTIONS.includes(collection)) return bad('unknown collection', 404);
  const rec = await request.json();
  if (!rec || typeof rec !== 'object') return bad('invalid record');
  if (!rec.id) rec.id = uid();

  // Keep an existing record's position; put a new record at the top.
  const existing = await env.DB.prepare('SELECT sort FROM entries WHERE collection=? AND id=?')
    .bind(collection, rec.id).first();
  let sort;
  if (existing) sort = existing.sort;
  else {
    const m = await env.DB.prepare('SELECT MIN(sort) AS s FROM entries WHERE collection=?').bind(collection).first();
    sort = (m && m.s != null ? m.s : 0) - 1;
  }

  await env.DB.prepare(
    'INSERT INTO entries (collection,id,data,sort,updated_at) VALUES (?1,?2,?3,?4,?5) ' +
    'ON CONFLICT(collection,id) DO UPDATE SET data=?3, updated_at=?5'
  ).bind(collection, rec.id, JSON.stringify(rec), sort, Date.now()).run();

  await touchContent(env);
  return json({ ok: true, id: rec.id });
}
