// The seam between the two Cloudflare accounts.
//
// The website and the messaging tool used to share one D1. They no longer do: the website's
// database must stay provably inside the free tier for ever, and D1's quotas are per ACCOUNT,
// so anything whose usage grows with the client's customer list cannot live beside it. The
// tool keeps its own database in its own account and pulls across this endpoint instead.
//
// What crosses: new contacts, and enquiry notifications waiting to be emailed. Both are
// watermarked, so a pull only ever fetches what is new and the cost to this side stays flat
// however large the mailing list grows.
//
// Auth is a shared secret, not an admin session: the caller is a machine and this has to keep
// working when nobody is signed in.
const json = (o) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json; charset=utf-8' } });

const authed = (request, env) => {
  const want = env.SYNC_TOKEN || '';
  if (!want) return false;                      // fail closed when unconfigured
  const got = request.headers.get('x-sync-token') || '';
  if (got.length !== want.length) return false;
  let diff = 0;                                  // constant time
  for (let i = 0; i < want.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
};

export async function onRequest({ request, env, params }) {
  if (!authed(request, env)) return new Response('unauthorised', { status: 401 });
  const route = Array.isArray(params.route) ? params.route.join('/') : String(params.route || '');
  const url = new URL(request.url);

  // Contacts recorded since the caller's watermark. The cursor is `created_at`, not `id`:
  // ids here are TEXT and not monotonic, so they cannot order a resumable pull. `id` breaks
  // ties so two rows written in the same millisecond cannot hide each other.
  if (route === 'contacts' && request.method === 'GET') {
    const since = Number(url.searchParams.get('since') || 0) || 0;
    const sinceId = url.searchParams.get('sinceId') || '';
    const limit = Math.min(Number(url.searchParams.get('limit') || 500) || 500, 1000);
    const { results } = await env.DB.prepare(
      `SELECT id, email, name, name_ar, company, phone, country, lang, source, consent_basis, created_at
         FROM contacts
        WHERE created_at > ? OR (created_at = ? AND id > ?)
        ORDER BY created_at, id LIMIT ?`
    ).bind(since, since, sinceId, limit).all();
    const rows = results || [];
    const last = rows[rows.length - 1];
    return json({
      rows,
      cursor: last ? last.created_at : since,
      cursorId: last ? last.id : sinceId,
      more: rows.length === limit,
    });
  }

  // Enquiries still awaiting a notification email. The tool sends them, because sending is
  // what the client pays for and it belongs on his account, not this one.
  if (route === 'notifications' && request.method === 'GET') {
    const maxTries = Number(url.searchParams.get('maxTries') || 5) || 5;
    const { results } = await env.DB.prepare(
      `SELECT id, kind, name, email, phone, company, subject, message, reason, market,
              position, route_email, lang, notify_tries, created_at
         FROM enquiries
        WHERE notified = 0 AND notify_tries < ? AND kind <> 'newsletter'
        ORDER BY created_at LIMIT 25`
    ).bind(maxTries).all();
    const rows = results || [];
    // The notification body lists what was attached, so the filenames travel with the row.
    for (const r of rows) {
      const f = await env.DB.prepare('SELECT filename FROM enquiry_files WHERE enquiry_id = ?').bind(r.id).all();
      r.files = (f.results || []).map((x) => x.filename);
    }
    return json({ rows });
  }

  // Results come back per enquiry, because the enquiry's own state lives here, not in the
  // tool: whether it was delivered, how many attempts it has had, and why the last one failed.
  // A configuration fault (bad keys, unverified domain) must NOT burn an attempt: it is not
  // this enquiry's fault and every waiting one will succeed once the setting is fixed.
  if (route === 'notified' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.results) ? body.results.slice(0, 100) : [];
    let sent = 0, failed = 0;
    for (const it of items) {
      const id = String(it.id || '');
      if (!id) continue;
      if (it.ok) {
        await env.DB.prepare('UPDATE enquiries SET notified = 1, notify_at = ?, notify_error = NULL WHERE id = ?')
          .bind(Date.now(), id).run();
        sent++;
      } else {
        const err = String(it.error || '').slice(0, 300);
        await env.DB.prepare(
          it.fatal
            ? 'UPDATE enquiries SET notify_error = ? WHERE id = ?'
            : 'UPDATE enquiries SET notify_tries = notify_tries + 1, notify_error = ? WHERE id = ?'
        ).bind(err, id).run();
        failed++;
      }
    }
    return json({ ok: true, sent, failed });
  }

  return new Response('not found', { status: 404 });
}
