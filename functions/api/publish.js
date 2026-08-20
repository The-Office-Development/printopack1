// GET  /api/publish  -> is anything edited but not yet live, and when was the last publish
// POST /api/publish  -> copy the current content into the `published` row, then trigger a
// site rebuild via the Cloudflare Pages Deploy Hook. The build reads /content, which serves
// that row. Editing is instant and private; this is the step that goes live.
import { json, readAll, COLLECTIONS, SINGLETONS, lastChangeAt } from './_shared.js';

// Compare the current content against the last published snapshot and report, per section,
// how many items were added, edited or removed. This is what lets the dashboard show the
// client exactly what a publish would put live, in plain language, before they commit to it.
function diffContent(current, snapshot) {
  const out = [];
  const prevEntries = (snapshot && snapshot.entries) || {};
  const prevSingles = (snapshot && snapshot.singletons) || {};
  for (const c of COLLECTIONS) {
    const before = new Map((prevEntries[c] || []).map((x) => [x.id, JSON.stringify(x)]));
    const after = new Map((current.entries[c] || []).map((x) => [x.id, JSON.stringify(x)]));
    let added = 0, edited = 0, removed = 0;
    for (const [id, s] of after) { if (!before.has(id)) added++; else if (before.get(id) !== s) edited++; }
    for (const id of before.keys()) { if (!after.has(id)) removed++; }
    if (added || edited || removed) out.push({ key: c, kind: 'collection', added, edited, removed });
  }
  for (const s of SINGLETONS) {
    const before = JSON.stringify((prevSingles[s]) ?? null);
    const after = JSON.stringify((current.singletons[s]) ?? null);
    if (before !== after) out.push({ key: s, kind: 'singleton' });
  }
  return out;
}

// The admin asks this on load so it can tell the client, plainly, whether what they are
// looking at is what the public sees. "Saved" and "live" are different things here, and the
// dashboard should never let that be ambiguous.
export async function onRequestGet({ env }) {
  const pub = await env.DB.prepare('SELECT data,updated_at FROM published WHERE key=?').bind('content').first();
  const edit = await env.DB.prepare(
    'SELECT MAX(t) AS t FROM (SELECT MAX(updated_at) AS t FROM entries UNION ALL SELECT MAX(updated_at) FROM singletons)'
  ).first();
  const publishedAt = pub ? pub.updated_at : null;
  // MAX(updated_at) cannot see a deletion (the row is gone), so the change stamp counts too.
  // Either one being newer than the last publish means something is waiting to go live.
  const changedAt = await lastChangeAt(env);
  const editedAt = Math.max(edit && edit.t ? edit.t : 0, changedAt || 0) || null;
  const pending = editedAt != null && (publishedAt == null || editedAt > publishedAt);

  // Only pay for the full diff when something is actually pending; a clean site skips it.
  let firstPublish = publishedAt == null;
  let changes = [];
  if (pending) {
    const current = await readAll(env);
    let snapshot = null;
    try { snapshot = pub ? JSON.parse(pub.data) : null; } catch (e) { snapshot = null; }
    changes = diffContent(current, snapshot);
  }

  return json({
    publishedAt,
    editedAt,
    // Never published at all still counts as pending, as long as there is something to publish.
    pending,
    // First-ever publish: the whole site goes live, so the client sees a different message.
    firstPublish,
    // Per-section summary of what a publish would put live (added / edited / removed).
    changes,
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

  // The hook's HTTP status is the whole point of calling it. Only catching a thrown network
  // error meant a 401 from a rotated hook URL still reported "deployed", and the client was
  // told the site was rebuilding when nothing had been asked to rebuild.
  let deployed = false;
  let deployError = null;
  if (env.DEPLOY_HOOK_URL) {
    try {
      const r = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
      deployed = r.ok;
      if (!r.ok) deployError = 'the rebuild service answered ' + r.status;
    } catch (e) {
      deployError = 'the rebuild service could not be reached';
    }
  } else {
    deployError = 'no rebuild is configured';
  }
  return json({ ok: true, deployed, deployError });
}
