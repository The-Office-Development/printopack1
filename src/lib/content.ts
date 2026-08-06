// Build-time content source. Everything the pages render comes from here.
//
// It imports db/seed.json (the committed baseline). On a Cloudflare production build,
// `scripts/fetch-content.mjs` runs first and refreshes db/seed.json in the build workspace
// with the published R2 snapshot, so the same import transparently yields live content.
// Locally (no CONTENT_URL) it stays the committed seed, so the site builds identically.
import seed from '../../db/seed.json';

type Rec = Record<string, any>;
const DB = seed as { entries: Record<string, Rec[]>; singletons: Record<string, Rec> };

/** Records for a collection (news, products, productGroups, team, careers, partners,
 *  factory, quality, responsibility, gallery, offices), in published order. */
export function collection(name: string): Rec[] {
  return DB.entries[name] || [];
}

/** A singleton object (about | settings). */
export function singleton(key: string): Rec {
  return DB.singletons[key] || {};
}

/** Wrap a flat en/ar pair into the { en, ar } shape the bilingual components expect. */
export const bi = (en: any, ar: any) => ({ en: en ?? '', ar: ar ?? en ?? '' });

/** Split a long admin text field into paragraphs, pairing English and Arabic by
 *  position. The client separates paragraphs with a blank line in the editor; an
 *  empty field renders nothing rather than an empty <p>. */
export function paragraphs(en: any, ar: any): { en: string; ar: string }[] {
  const split = (t: any) => String(t ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const e = split(en);
  const a = split(ar);
  return e.map((p, i) => ({ en: p, ar: a[i] || p }));
}

/** Split a list-style admin field into its lines, pairing English and Arabic by position.
 *  Used where the client types one item per line (job requirements) and the page renders a
 *  bullet each. Differs from `paragraphs`, which splits on blank lines instead. */
export function lines(en: any, ar: any): { en: string; ar: string }[] {
  const split = (t: any) => String(t ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const e = split(en);
  const a = split(ar);
  return e.map((l, i) => ({ en: l, ar: a[i] || l }));
}

/** The counter numbers, read from the editable `about` singleton so the client owns
 *  every stat on the site from one place in the admin. `founded` drives the
 *  "since <year>" counters, which climb to the current year, so they never go stale.
 *  Anything the database already answers (partners, factory departments) is counted
 *  from the collection instead of being typed twice. */
const _num = (v: unknown, fallback: number) => {
  const n = parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const _about = singleton('about');
const _employees = _num(_about.statEmployees, 400);
const _avgExp = _num(_about.statAvgExp, 14);
export const stats = {
  founded: _num(_about.statFounded, 1997),
  countries: _num(_about.statCountries, 35),
  /** Regional offices: counted from the offices collection, not typed. The counter always
   *  matches the list beneath it (the same "Regional & Export" group the Contact directory and
   *  the footer render), so splitting or adding an office in the admin updates it with no second
   *  number to keep in step. Falls back to the old `statOffices` only if the collection is empty. */
  offices: collection('offices').filter((o) => o.group === 'Regional & Export').length || _num(_about.statOffices, 10),
  employees: _employees,
  avgExp: _avgExp,
  /** Total experience across the team, in years. Derived from the two numbers the client
   *  already maintains rather than typed as a third, so it can never contradict them:
   *  change the head count or the average in the admin and this follows. */
  totalExp: _employees * _avgExp,
  customers: _num(_about.statCustomers, 1000),
  /** Production departments: the factory collection minus the warehouses entry. */
  departments: collection('factory').filter((d) => !/warehouse/i.test(d.name || '')).length || 5,
  /** Brand partners: however many logos the admin has on the partners wall. */
  partners: collection('partners').length,
};

/** Format an ISO date (YYYY-MM-DD) as "27 Aug 2023" to match the original display. */
export function displayDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(+d)) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
