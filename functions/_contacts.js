// The shared contact book, written from the public website's forms.
//
// This is the join between the two halves of the system. The mailing tool does not import
// anything from the website: it reads the rows this file writes, in the same database, the
// moment they are written. An address typed into the contact form on a Tuesday is in the
// audience of the newsletter sent on the Wednesday, with no step in between for anyone to
// forget. Underscore-prefixed files are importable but never routed by Pages.

export const normaliseEmail = (v) =>
  String(v == null ? '' : v).trim().toLowerCase();

// Deliberately permissive: one @, something either side, a dot in the domain, no spaces.
// Anything stricter starts rejecting real addresses, and a wrong address costs a bounce
// while a rejected customer costs an enquiry.
export function validEmail(v) {
  const e = normaliseEmail(v);
  return e.length >= 6 && e.length <= 254 && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/.test(e);
}

const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Tags are stored comma-wrapped (",jeddah,partners,") so a LIKE search for ",jo," cannot
// also match ",jordan,". Everything that touches tags goes through these two.
export const tagList = (s) => String(s || '').split(',').map((t) => t.trim()).filter(Boolean);
export const tagStore = (arr) => ',' + [...new Set(arr.map((t) => String(t).trim()).filter(Boolean))].join(',') + ',';

/**
 * Record a contact from something that happened on the website.
 *
 * Three rules, all of them about not doing harm to a list that is sent to for years:
 *
 *  1. An address already known is never duplicated and never downgraded. Blank details are
 *     filled in from the new submission; details already there are kept, because the earlier
 *     ones were typed by the same person and later forms carry less (the newsletter box asks
 *     for an address and nothing else).
 *  2. Consent is only ever recorded once, at its earliest point. Someone who opted in to the
 *     newsletter in March and sent an enquiry in August did not consent in August.
 *  3. Someone who has unsubscribed, bounced or complained STAYS that way. Sending an enquiry
 *     is not a request to be put back on a mailing list they left, and quietly reviving them
 *     is exactly how a sender's reputation is destroyed. Their enquiry is still answered:
 *     that is a reply to a person, not a campaign.
 */
export async function upsertContact(env, {
  email, name, nameAr, company, phone, country, lang,
  source, consentBasis, consentNote, tags = [],
}) {
  const e = normaliseEmail(email);
  if (!validEmail(e)) return { ok: false, reason: 'invalid email' };
  const now = Date.now();

  const existing = await env.DB.prepare('SELECT * FROM contacts WHERE email=?').bind(e).first();

  if (existing) {
    const mergedTags = tagStore([...tagList(existing.tags), ...tags]);
    await env.DB.prepare(
      `UPDATE contacts SET
         name=COALESCE(NULLIF(name,''),?2), name_ar=COALESCE(NULLIF(name_ar,''),?3),
         company=COALESCE(NULLIF(company,''),?4), phone=COALESCE(NULLIF(phone,''),?5),
         country=COALESCE(NULLIF(country,''),?6),
         lang=?7, tags=?8, updated_at=?9
       WHERE email=?1`
    ).bind(e, name || '', nameAr || '', company || '', phone || '', country || '',
           lang || existing.lang || 'en', mergedTags, now).run();
    return { ok: true, id: existing.id, created: false, status: existing.status };
  }

  // A brand-new address that is already on the never-send list (an old unsubscribe, a hard
  // bounce) is recorded in the state it belongs in, not as a fresh active subscriber.
  const supp = await env.DB.prepare('SELECT reason FROM suppression WHERE email=?').bind(e).first();
  const status = supp ? (supp.reason === 'unsubscribe' ? 'unsubscribed' : 'bounced') : 'active';

  const id = uid();
  await env.DB.prepare(
    `INSERT INTO contacts
       (id,email,name,name_ar,company,phone,country,lang,source,consent_basis,consent_at,
        consent_note,status,status_at,tags,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?16)`
  ).bind(id, e, name || '', nameAr || '', company || '', phone || '', country || '',
         lang || 'en', source, consentBasis, now, consentNote || '',
         status, status === 'active' ? null : now, tagStore(tags), now).run();

  return { ok: true, id, created: true, status };
}

/**
 * Per-IP throttle for the public form endpoint, in a fixed window.
 * Returns true when the request may proceed.
 */
export async function formGuardOk(env, ip, limit = 8, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  try {
    const row = await env.DB.prepare('SELECT hits,window_start FROM form_guard WHERE ip=?').bind(ip).first();
    if (!row || now - row.window_start > windowMs) {
      await env.DB.prepare(
        'INSERT INTO form_guard (ip,hits,window_start,updated_at) VALUES (?1,1,?2,?2) ' +
        'ON CONFLICT(ip) DO UPDATE SET hits=1, window_start=?2, updated_at=?2'
      ).bind(ip, now).run();
      return true;
    }
    if (row.hits >= limit) return false;
    await env.DB.prepare('UPDATE form_guard SET hits=hits+1, updated_at=?2 WHERE ip=?1').bind(ip, now).run();
    return true;
  } catch (e) {
    // The guard is a courtesy, not the gate. If its table is missing on a half-migrated
    // database, an enquiry from a real customer still gets through.
    return true;
  }
}
