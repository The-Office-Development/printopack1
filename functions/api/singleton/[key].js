// GET /api/singleton/:key   -> read a singleton (about | settings)
// PUT /api/singleton/:key   -> write a singleton
import { SINGLETONS, json, bad, touchContent } from '../_shared.js';

export async function onRequestGet({ env, params }) {
  if (!SINGLETONS.includes(params.key)) return bad('unknown singleton', 404);
  const r = await env.DB.prepare('SELECT data FROM singletons WHERE key=?').bind(params.key).first();
  return json(r ? JSON.parse(r.data) : {});
}

export async function onRequestPut({ env, params, request }) {
  if (!SINGLETONS.includes(params.key)) return bad('unknown singleton', 404);
  const obj = await request.json();
  await env.DB.prepare(
    'INSERT INTO singletons (key,data,updated_at) VALUES (?1,?2,?3) ' +
    'ON CONFLICT(key) DO UPDATE SET data=?2, updated_at=?3'
  ).bind(params.key, JSON.stringify(obj), Date.now()).run();
  await touchContent(env);
  return json({ ok: true });
}
