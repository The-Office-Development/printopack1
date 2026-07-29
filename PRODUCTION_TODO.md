# Pre-production checklist

Things to do before this site goes live (do NOT ship these dev conveniences).

## Remove admin-facing placeholder notes
During the build, several pages carry small helper notes that explain the CMS
workflow to us, e.g.:

> "Certificate documents, the licence number and the Saudization and Mowaamah
> certificates are added and kept current by Printopack through the site's admin."
> (Arabic: "تُضيف برنتوباك وثائق الشهادات ورقم الترخيص ... عبر لوحة تحكم الموقع.")

These are for our reference only and must be **removed before production**, they should
not be visible to site visitors. Known locations (search for these classes/strings):
- `quality.astro` — `.qnote` ("...appear here through the site's admin")
- `partners.astro` — `.pnote` ("Partner names and countries are added and kept current ... through the site's admin")
- `careers.astro` — `.cnote` ("Open roles are posted and kept current ... through the site's admin")
- `news.astro` — `.evnote` ("Exhibitions and events are posted and kept current ... through the site's admin"); also the two sample exhibitions (Gulfood / Saudi Food Expo) are placeholders
- `gallery.astro` — `.sample-note` ("These are sample placeholders ...") + the sample video/advertisement items are placeholders (real media added via admin)
- `contact.astro` — `.cnote` ("Office manager names are added by Printopack through the site's admin"); the per-office "Office manager" staff line is a placeholder until real names are provided
- Any page built later with a similar "added/updated by Printopack through the admin" line.

Tip: these notes use muted italic helper classes (`resp-note`, `qnote`, etc.). Strip the
lines, not the surrounding content.

## Sample products (added 2026-07-29)
`db/seed.json` now carries **4 sample products** in the "Chips & Snacks" group only
(`prod-01` .. `prod-04`: Pillow Bags, Gusseted Bags, Zipper Bags, Stand-up Pouches). They exist
so the new product list on `/products/[slug]` is visible and reviewable while the real catalogue
is still client-gated.

They are real bag formats from Printopack's own catalogue and their descriptions are factual, so
they are not embarrassing if seen, but they are **not a real product list**. Deliberately they
carry **no image**, so no invented photography ships; the card falls back to the product's
initials. Replace or delete them through the admin once the client supplies the real catalogue.
The other 19 groups have no products, and the section simply does not render for them.

## Other pre-production items
- Real certificates are now live (from `Desktop\printopack-data`): BRCGS + ISO 22000 badges on Quality/Certificates; ISO 14001 + ISO 45001 badges + the real Mowaamah 2025 certificate (links to `/downloads/mowaamah-certificate-2025.pdf`) on Social Responsibility. The old `public/images/cert-brcgs.jpg` is now unreferenced (safe to delete). If the client sends full ISO/BRCGS certificate documents, swap the badge images for the actual certificate scans.
- Product catalogue PDF is live at `/downloads/printopack-catalogue.pdf` (Products page "Download our catalogue"). Replace if the client issues a newer edition.
- Countries-served figure raised 26 -> 35 site-wide (from the client's own catalogue "over 35 countries"); regional-offices counter set to 10 (home + company + contact). Both are admin-editable (Settings > Counters), so no client sign-off needed.
- Contact offices: every office manager NAME, TITLE, phone and email is editable in the admin (Offices & Contact model, bilingual). Three offices carry real managers from their business cards (Kuwait: Nader Bilal, Regional Sales Leader; Tunisia & Libya: Sami Monser, Regional Sales Manager; Algeria: Elhaoues Chemseddine, Regional Sales Leader); the remaining 12 are "Name Name" placeholders. Admin "New office" button was unbound for all collections (topbar not wired) and is now fixed; admin DB key bumped v2 -> v3 so the demo reseeds with the 15 real offices + new fields.
- Get the client's final Arabic sign-off on drafted vision/mission text.
- Fill client-gated placeholders (owner names/photos, team, product descriptions, etc.).
- Wire the admin to a real backend (currently a localStorage demo).
- Contact form routing: the enquiry form writes the resolved recipient into a hidden `route_email` field (the "autonomous mapper"). On the real domain, add a Netlify Function (or backend handler) that reads `route_email` and forwards/delivers to that inbox; the same applies to the Careers form (`applications_email`).
- Syria office uses a personal address (`bsh_moneer@hotmail.com`), not a `printopack.com.sa` one. It's from Amal's directory and is fully admin-editable (Offices & Contact), so the client can change or remove it themselves; no action needed on our side.
