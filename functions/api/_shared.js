// Shared helpers for the Printopack content API (Cloudflare Pages Functions).
// Files/dirs starting with "_" are not routed by Pages, but can be imported.
// The whole /api/* path is gated by Cloudflare Access (edge auth); these helpers keep
// the handlers small.

// MUST stay in step with COLLECTIONS in public/admin/admin.js. A name missing here makes
// that whole section silently read-only in production: every save, delete and reorder 404s
// while the admin still shows an optimistic "saved". 'formats' and 'standard' were missing
// until 2026-08-20, which is exactly how that failure looked.
export const COLLECTIONS = [
  'news', 'productGroups', 'products', 'team', 'careers', 'partners',
  'factory', 'quality', 'responsibility', 'gallery', 'offices', 'values',
  'formats', 'standard',
];
export const SINGLETONS = ['about', 'settings'];

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export const bad = (msg, status = 400) => json({ error: msg }, status);

export const uid = () =>
  'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Stamp "the content changed just now". Every mutating route calls this.
//
// Publish used to decide whether anything was waiting by taking MAX(updated_at) across the
// surviving rows, which cannot see a deletion: delete a news post and the newest remaining
// row is older than the last publish, so the dashboard says "Everything is live" while the
// deleted post is still on the public site. This row is the one thing that always moves.
export async function touchContent(env) {
  try {
    await env.DB.prepare(
      "INSERT INTO site_meta (key,value,updated_at) VALUES ('last_change',?1,?1) " +
      'ON CONFLICT(key) DO UPDATE SET value=?1, updated_at=?1'
    ).bind(Date.now()).run();
  } catch (e) { /* table missing on an un-migrated database: publish falls back to MAX(updated_at) */ }
}

// The last content change, including deletions. Null when the table has never been written.
export async function lastChangeAt(env) {
  try {
    const r = await env.DB.prepare("SELECT value FROM site_meta WHERE key='last_change'").first();
    return r && r.value ? Number(r.value) : null;
  } catch (e) { return null; }
}

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
