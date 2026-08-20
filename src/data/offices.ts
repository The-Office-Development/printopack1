// The offices behind the reach map, built from the `offices` collection so the client owns
// them. This used to be an `officesByCc` object literal duplicated in BOTH contact.astro and
// partners.astro: editing an office in the admin changed the directory list underneath the
// map while the map itself kept saying something else, and any correction had to be made by
// hand in two files.
//
// A record joins the map through its `cc` field, which the admin sets. A record with no `cc`
// (the Saudi sub-offices: Riyadh, Dammam, Key Accounts) stays in the directory and off the
// map, which is deliberate: the map colours countries, not branches.
//
// `int` (International Sales) is a market rather than a territory. It appears in the
// selectors and never on the map, and that falls out for free: the map is drawn from
// `reachMap.served`, which has no `int` key.
import { collection } from '../lib/content';
import { reachMap } from './reach-map';

export type Bi = { en: string; ar: string };
export type MapOffice = { cc: string; name: Bi; role: Bi; place: Bi; email: string; phone: string;
  /** The manager's picture and, until one is uploaded, their initials. Shown on the selected
   *  office card so the enquiry has a face against it. */
  photo: string; mono: string };

/** Initials for the photo placeholder: the manager's, falling back to the office name. */
const initials = (name: string, fallback: string) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const real = parts.filter((w) => w.toLowerCase() !== 'name');
  const src = real.length ? real : String(fallback || '').trim().split(/\s+/);
  return src.slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
};

/** Country labels for the map. These are country names, not client copy, so they live in code
 *  rather than becoming another thing for the creative manager to maintain and mistype. When
 *  the country toggles land (8f), every remaining Arab state gets its entry here. */
export const COUNTRY_NAMES: Record<string, Bi> = {
  sa: { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  kw: { en: "Kuwait", ar: "الكويت" },
  jo: { en: "Jordan", ar: "الأردن" },
  iq: { en: "Iraq", ar: "العراق" },
  eg: { en: "Egypt", ar: "مصر" },
  sd: { en: "Sudan", ar: "السودان" },
  tn: { en: "Tunisia", ar: "تونس" },
  ly: { en: "Libya", ar: "ليبيا" },
  dz: { en: "Algeria", ar: "الجزائر" },
  ma: { en: "Morocco", ar: "المغرب" },
  ye: { en: "Yemen", ar: "اليمن" },
  sy: { en: "Syria", ar: "سوريا" },
  // Switched off today: the map holds their geometry, and creating an office for one from
  // the admin's Countries panel is what puts it on the map.
  qa: { en: "Qatar", ar: "قطر" },
  bh: { en: "Bahrain", ar: "البحرين" },
  om: { en: "Oman", ar: "عُمان" },
  lb: { en: "Lebanon", ar: "لبنان" },
  ae: { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  ps: { en: "Palestine", ar: "فلسطين" },
  dj: { en: "Djibouti", ar: "جيبوتي" },
  mr: { en: "Mauritania", ar: "موريتانيا" },
  // Not a territory: it appears in the selectors and never on the map.
  int: { en: "International", ar: "دولي" },
};

const ROLE_HEAD: Bi = { en: "Head Office", ar: "المقر الرئيسي" };
const ROLE_REGIONAL: Bi = { en: "Regional Office", ar: "مكتب إقليمي" };
const ROLE_INTERNATIONAL: Bi = { en: "International Sales", ar: "المبيعات الدولية" };

const roleFor = (cc: string): Bi =>
  cc === 'sa' ? ROLE_HEAD : cc === 'int' ? ROLE_INTERNATIONAL : ROLE_REGIONAL;

/** Offices keyed by map country code. Drives the map paths, the popups, the market pull-down
 *  on Contact and the country chips on Partners. */
export const officesByCc: Record<string, MapOffice> = {};
for (const o of collection('offices')) {
  const cc = String(o.cc || '').trim();
  if (!cc || !COUNTRY_NAMES[cc] || officesByCc[cc]) continue; // first record per country wins
  const name = COUNTRY_NAMES[cc];
  const role = roleFor(cc);
  // The record's own label (`city`) becomes the second line, but only when it says something
  // the country name and the role have not already said: "Head Office, Jeddah" is worth
  // showing under Saudi Arabia, "International Sales" under International Sales is noise.
  const label: Bi = { en: o.city || '', ar: o.cityAr || o.city || '' };
  const redundant = !label.en || label.en === name.en || label.en === role.en;
  officesByCc[cc] = {
    cc,
    name,
    role,
    place: redundant ? { en: '', ar: '' } : label,
    email: o.email || '',
    phone: o.phone || '',
    photo: o.photo || '',
    mono: initials(o.staffName, o.city),
  };
}

/** The countries actually drawn on the map: those with an office AND geometry to draw. This
 *  is the switch behind the admin's Countries panel. Creating a Qatar office there makes
 *  `qa` active here, and Qatar appears on both maps without anything else being touched. */
export const activeCcs: string[] = Object.keys(officesByCc).filter(
  (cc) => cc !== 'int' && cc in reachMap.paths,
);

/** Selector order: Saudi first and default, then the region as the client lists it, with
 *  International last because it is the catch-all rather than a place. */
export const marketOrder: string[] = Object.keys(officesByCc)
  .sort((a, b) => {
    const rank = (cc: string) => (cc === 'sa' ? 0 : cc === 'int' ? 2 : 1);
    return rank(a) - rank(b);
  });
