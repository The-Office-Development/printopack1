// Which map country a partner belongs to, read from the free-text country the client types.
//
// The partner form's country is free text, and it is typed the way people write an address:
// "Saudi Arabia - Jeddah", "Jeddah - Saudi Arabia", "Jeddah- Saudi Arabia", "جدة – السعودية".
// The map filter used to compare that text to the office's country name exactly, so on
// 2026-09-13 selecting Saudi Arabia showed 1 of 16 Saudi partners, and Egypt and Yemen showed
// none. Resolving each partner to a country code once, at build time, lets the filter compare
// codes instead.
//
// No imports on purpose: the admin carries a copy of this logic (`matchCountry` in
// public/admin/admin.js) to warn when a country will not be recognised, and the two must
// agree. Change one, change the other.

export type Bi = { en: string; ar: string };

/** Names people actually type for a country beyond the map's own labels. Normalised on load,
 *  so variants of alef, ya and ta marbuta need no entries of their own. */
const ALIASES: Record<string, string[]> = {
  sa: ['Saudi', 'KSA', 'Kingdom of Saudi Arabia', 'السعودية'],
  ae: ['UAE', 'Emirates', 'الإمارات'],
};

/** Lower case, no diacritics or tatweel, one spelling of alef, ya and ta marbuta. */
export const normCountry = (s: string): string =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // diacritics (incl. shadda) and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Builds a matcher over the map's country names. Returns (english, arabic) => code, or ''
 *  when neither names a known country. English is tried first, then Arabic. */
export function makeCountryMatcher(names: Record<string, Bi>) {
  const byName = new Map<string, string>();
  const add = (cc: string, name: string) => {
    const k = normCountry(name);
    if (k && !byName.has(k)) byName.set(k, cc);
  };
  for (const [cc, n] of Object.entries(names)) {
    if (cc === 'int') continue; // a market, not a country anyone types
    add(cc, n.en);
    add(cc, n.ar);
  }
  for (const [cc, list] of Object.entries(ALIASES)) if (names[cc]) list.forEach((n) => add(cc, n));
  const longestFirst = [...byName.keys()].sort((a, b) => b.length - a.length);

  const one = (text: string): string => {
    const t = normCountry(text);
    if (!t) return '';
    // "City - Country" in either order, with any dash, comma or slash between the two.
    let hits = t.split(/\s*[-–—,/|،]\s*/).map((part) => byName.get(part)).filter(Boolean) as string[];
    // No separator at all ("Jeddah Saudi Arabia"): look for a whole-word country name.
    if (!hits.length) {
      const padded = ` ${t} `;
      const k = longestFirst.find((name) => padded.includes(` ${name} `));
      if (k) hits = [byName.get(k)!];
    }
    // Without its diacritics, عمان is both Oman and Amman, Jordan's capital. When another
    // country is also named ("عمّان - الأردن"), that one is meant.
    if (hits.length > 1) hits = hits.filter((cc) => cc !== 'om');
    return hits[0] || '';
  };

  return (en: string, ar: string): string => one(en) || one(ar);
}
