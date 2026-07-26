// Shared helpers for the Printopack content API (Cloudflare Pages Functions).
// Files/dirs starting with "_" are not routed by Pages, but can be imported.
// The whole /api/* path is gated by Cloudflare Access (edge auth); these helpers keep
// the handlers small.

export const COLLECTIONS = [
  'news', 'productGroups', 'products', 'team', 'careers', 'partners',
  'factory', 'quality', 'responsibility', 'gallery', 'offices', 'values',
];
export const SINGLETONS = ['about', 'settings'];

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export const bad = (msg, status = 400) => json({ error: msg }, status);

export const uid = () =>
  'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Read the whole content set from D1 (used by /api/bootstrap and /api/publish).
export async function readAll(env) {
  const rows = await env.DB.prepare('SELECT collection,id,data FROM entries ORDER BY collection,sort').all();
  const singles = await env.DB.prepare('SELECT key,data FROM singletons').all();
  const entries = {};
  for (const c of COLLECTIONS) entries[c] = [];
  for (const r of rows.results) (entries[r.collection] ||= []).push(JSON.parse(r.data));
  const singletons = {};
  for (const s of singles.results) singletons[s.key] = JSON.parse(s.data);
  return { entries, singletons };
}
