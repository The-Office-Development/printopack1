// POST /api/enquiry  -> the one place every public form on the website submits to.
//
// Open by design (the visitor has no login), and the only open write endpoint on the site.
// It replaces `data-netlify="true"`, which was left over from a Netlify deploy: the site
// ships on Cloudflare Pages, where nothing answers that, so every enquiry and every job
// application posted since the move was lost with a 405 and nobody was told.
//
// What happens here, in order, and why that order:
//   1. the enquiry is stored, with its files
//   2. the address is added to the shared contact book, with the basis for writing to it
//   3. nothing is emailed
//
// The notification to the office is sent by the mailer worker, which is the only piece of
// this system holding sending credentials, and it picks up un-notified enquiries every
// minute. So a mail outage delays a notification; it cannot lose an enquiry. The enquiry is
// in the dashboard either way.
import { json, bad } from './_shared.js';
import { upsertContact, validEmail, normaliseEmail, formGuardOk } from '../_contacts.js';

const MAX_FILE_BYTES = 2 * 1024 * 1024;      // D1 allows 2 MB in one bound blob
const MAX_FILES = 2;                          // a CV and a covering letter
const MAX_TEXT = 5000;                        // a long enquiry is ~1500 characters
const OK_FILE = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};
const OK_EXT = ['pdf', 'doc', 'docx'];

const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clip = (v, n = MAX_TEXT) => String(v == null ? '' : v).trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';

  let form;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      form = { get: (k) => (body && body[k] != null ? body[k] : null), getAll: () => [] };
    } else {
      const fd = await request.formData();
      form = fd;
    }
  } catch (e) {
    return bad('We could not read that submission. Please try again.');
  }

  // The honeypot field is hidden from people and irresistible to scripts. A filled one is
  // answered with a cheerful 200 and thrown away: telling a bot it failed only teaches it.
  if (clip(form.get('bot-field'), 200)) return json({ ok: true });

  const email = normaliseEmail(form.get('email'));
  if (!validEmail(email)) return bad('Please enter a valid email address so we can reply.');

  const kindRaw = clip(form.get('kind'), 30) || (form.get('position') ? 'application' : 'enquiry');
  const kind = ['enquiry', 'application', 'newsletter'].includes(kindRaw) ? kindRaw : 'enquiry';

  // The newsletter box on every page asks for an address and nothing else, on purpose: one
  // field is the difference between someone subscribing and someone not bothering.
  const name = clip(form.get('name'), 200);
  if (!name && kind !== 'newsletter') return bad('Please enter your name.');

  if (!(await formGuardOk(env, ip))) {
    return json({ error: 'You have sent several messages recently. Please try again a little later.' }, 429);
  }
  const lang = clip(form.get('lang'), 5) === 'ar' ? 'ar' : 'en';

  const rec = {
    id: uid(),
    kind,
    name,
    email,
    phone: clip(form.get('phone'), 60),
    company: clip(form.get('company'), 200),
    subject: clip(form.get('subject'), 300),
    message: clip(form.get('message')),
    reason: clip(form.get('reason') || form.get('department'), 120),
    market: clip(form.get('target_market'), 12),
    position: clip(form.get('position'), 200),
    // The site works out which office should answer, and the notification follows that.
    // It is validated rather than trusted: this field decides where mail is sent, and it
    // arrives from a form anyone can rewrite in their browser.
    routeEmail: normaliseEmail(form.get('route_email') || form.get('applications_email')),
    lang,
  };
  if (rec.routeEmail && !validEmail(rec.routeEmail)) rec.routeEmail = '';

  const now = Date.now();
  try {
    await env.DB.prepare(
      `INSERT INTO enquiries
         (id,kind,name,email,phone,company,subject,message,reason,market,position,route_email,
          lang,status,notified,ip,created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'new',0,?14,?15)`
    ).bind(rec.id, rec.kind, rec.name, rec.email, rec.phone, rec.company, rec.subject,
           rec.message, rec.reason, rec.market, rec.position, rec.routeEmail, rec.lang,
           ip, now).run();
  } catch (e) {
    // Almost always one thing: the site was deployed before db/migrations/001 was applied,
    // so the table is not there. A visitor must not meet a stack trace over it, and must be
    // given a way to reach the company that does not depend on us.
    return json({
      error: 'We could not record your message just now. Please email us directly at info@printopack.com.sa and we will answer.',
    }, 503);
  }

  // Attachments. A file that is refused does not lose the application: the enquiry is
  // already stored, and the reply says which file did not make it and why, so the applicant
  // can send it on rather than filling the whole form in again.
  const rejected = [];
  let stored = 0;
  for (const field of ['cv', 'cover_letter']) {
    const f = typeof form.get === 'function' ? form.get(field) : null;
    if (!f || typeof f === 'string' || !f.name) continue;
    if (stored >= MAX_FILES) break;
    const ext = String(f.name).split('.').pop().toLowerCase();
    if (!OK_FILE[f.type] && !OK_EXT.includes(ext)) {
      rejected.push(f.name + ' (only PDF or Word files)');
      continue;
    }
    if (f.size > MAX_FILE_BYTES) {
      rejected.push(f.name + ' (over 2 MB)');
      continue;
    }
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      await env.DB.prepare(
        'INSERT INTO enquiry_files (id,enquiry_id,field,filename,mime,size,bytes,created_at) ' +
        'VALUES (?1,?2,?3,?4,?5,?6,?7,?8)'
      ).bind('f' + uid(), rec.id, field, clip(f.name, 200),
             f.type || 'application/octet-stream', bytes.length, bytes, now).run();
      stored++;
    } catch (e) {
      rejected.push(f.name + ' (could not be stored)');
    }
  }

  // The contact book. This is the step that makes the mailing tool's list build itself.
  // The basis is recorded from what the person actually did: ticking a newsletter box is an
  // opt-in to marketing; sending an enquiry is a business enquiry, which is a weaker and
  // more honest basis, and it is written down as such rather than dressed up as consent.
  const basis = kind === 'newsletter' ? 'newsletter_optin' : 'enquiry';
  const note = kind === 'newsletter'
    ? 'Subscribed from the newsletter box on the website'
    : (kind === 'application'
        ? 'Applied for ' + (rec.position || 'a role') + ' on the website'
        : 'Enquiry from the website' + (rec.reason ? ' (' + rec.reason + ')' : ''));
  try {
    await upsertContact(env, {
      email, name, company: rec.company, phone: rec.phone, country: rec.market, lang,
      source: kind === 'application' ? 'website_careers' : (kind === 'newsletter' ? 'newsletter' : 'website_enquiry'),
      consentBasis: basis,
      consentNote: note + ' on ' + new Date(now).toISOString().slice(0, 10),
      tags: [kind === 'application' ? 'applicant' : (kind === 'newsletter' ? 'newsletter' : 'website')],
    });
  } catch (e) {
    // The contact book is a bonus on top of the enquiry, never a reason to fail one.
  }

  return json({ ok: true, id: rec.id, rejected });
}

// A GET here is someone opening the URL by hand, or an old bookmark. Say so plainly.
export const onRequestGet = () => json({ error: 'This address only accepts form submissions.' }, 405);
