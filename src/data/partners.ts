// Success partners, from the admin-managed collection. Shared by the Partners page (the full
// wall) and the home page (the "main partners" strip), so the two can never drift apart.
import { collection } from '../lib/content';

export type Bi = { en: string; ar: string };
export type Partner = { logo: string; name: Bi; country: Bi; link: string; featured: boolean };

/** How many partners the home page shows. The client's rule: there are always exactly 20
 *  main partners. The admin enforces the count on the way in; this is the backstop on the
 *  way out, so a miscount can never change the home page's shape. */
export const MAIN_COUNT = 20;

export const partners: Partner[] = collection('partners').map((p) => ({
  logo: p.image,
  name: { en: p.name || '', ar: p.nameAr || p.name || '' },
  country: { en: p.country || '', ar: p.countryAr || p.country || '' },
  link: p.link || '',
  // Missing means NOT main. A partner added without the flag must not quietly become the
  // 21st logo on the home page; `mainPartners` below tops the strip up instead.
  featured: String(p.featured ?? '') === 'true',
}));

/** The main partners, for the home page. Falls back to the first records in the client's own
 *  order if fewer than 20 are flagged, so the strip is never short because someone unticked
 *  one and forgot to tick another. */
export const mainPartners: Partner[] = (() => {
  const flagged = partners.filter((p) => p.featured);
  if (flagged.length >= MAIN_COUNT) return flagged.slice(0, MAIN_COUNT);
  const rest = partners.filter((p) => !p.featured);
  return [...flagged, ...rest].slice(0, MAIN_COUNT);
})();

/** Countries present on the wall, in the order the client arranged the partners, so the
 *  filter list mirrors the wall rather than imposing an alphabet on it. Blank countries are
 *  skipped: a partner whose country is not filled in yet simply is not filterable. */
export const partnerCountries: Bi[] = (() => {
  const seen = new Set<string>();
  const out: Bi[] = [];
  for (const p of partners) {
    const key = p.country.en.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p.country);
  }
  return out;
})();
