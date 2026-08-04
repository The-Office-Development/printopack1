// Product groups, sourced from the content store (db/seed.json baseline, or the live published
// snapshot on a Cloudflare build). The page shape is preserved so products.astro and the
// /products/[slug] route need no change. `filters` is a fixed browse taxonomy (structural).
import { collection } from '../lib/content';

export type Bi = { en: string; ar: string };

export const filters: { key: string; label: Bi }[] = [
  { key: "all", label: { en: "All products", ar: "كل المنتجات" } },
  // "Nuts" left the label with the group: Amal's approved taxonomy has no Nuts section.
  { key: "snacks", label: { en: "Snacks", ar: "الوجبات الخفيفة" } },
  { key: "confectionery", label: { en: "Confectionery", ar: "الحلويات" } },
  { key: "bakery", label: { en: "Bakery & Breads", ar: "المخابز والخبز" } },
  { key: "staples", label: { en: "Pantry Staples", ar: "المؤن الأساسية" } },
  { key: "beverage", label: { en: "Bottles & Liquids", ar: "القوارير والسوائل" } },
  { key: "chilled", label: { en: "Frozen & Chilled", ar: "المجمّدة والمبرّدة" } },
  { key: "specialty", label: { en: "Specialty", ar: "منتجات خاصة" } },
];

/** The sub-items inside each group, in the order the client arranged them. Amal's approved
 *  taxonomy lists these under their group ("Chips, Tortilla, Rice Crackers..."), and they are
 *  sections within the group's page rather than pages of their own. `category` holds the
 *  group's English name, which is what the admin's Group select writes. */
export const subItems = collection('products')
  .filter((r) => String(r.active ?? 'true') !== 'false')
  .map((r) => ({
    group: r.category || '',
    name: { en: r.name || '', ar: r.nameAr || r.name || '' },
    desc: { en: r.description || '', ar: r.descriptionAr || r.description || '' },
    image: r.image || '',
    // A size chart is read, not admired: it gets its own full-width presentation instead of
    // the alternating photo-and-description row.
    isMeasurements: String(r.kind || '') === 'Measurements',
  }));

/** The sub-items belonging to one group, by its English name. */
export const subItemsOf = (groupName: string) => subItems.filter((s) => s.group === groupName);

/** A group's URL. The client never sees or types slugs, so one is derived from the English
 *  name when the record has none. Without this a group created in the dashboard would build
 *  to /products/undefined and its page would be unreachable. */
const slugify = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'group';

export const categories = collection('productGroups').map((r) => ({
  slug: r.slug || slugify(r.name),
  group: r.filter,
  img: r.image,
  name: { en: r.name, ar: r.nameAr },
  desc: { en: r.description, ar: r.descriptionAr },
  // A measurements group (Bags Measurements) is a chart rather than a product range: its
  // page shows the drawing as large as the layout allows instead of beside a column of copy.
  isMeasurements: String(r.kind || '') === 'Measurements',
}));
