# Printopack — current status

_Last updated: 2026-07-26_

## What we're doing (the big picture)
Moving all of the website's content out of hardcoded pages and into a real, free, self-managed
backend, so Printopack can add / edit / remove everything themselves for years with **no developer
and no fees**. The public site stays static and fast; the admin dashboard writes to a real database;
a "Publish" button rebuilds the site.

Full technical plan: **`BACKEND_MIGRATION_PLAN.md`**.

## The stack (agreed)
- **Cloudflare Pages** hosts the static site. **D1** is the content database. **R2** stores uploaded
  images. **Access** is the admin login (email one-time code). A **deploy hook** rebuilds on publish.
- **Videos are NOT hosted by us** — they are YouTube/Vimeo links (free, unlimited, no storage on our
  side). Only images live in R2, which are tiny, so the free tier is never at risk.
- Free forever, nothing that pauses, nothing that bills under normal use.

## Done
- **Phase 1 — content schema + seed.** `db/schema.sql` + `db/seed.json` (all real content: 116
  records across 12 collections + `about`/`settings`) + `db/seed.sql` generator.
- **Phase 2 — backend API + admin swap.** `functions/api/*` (list/create/delete, singletons, image
  upload, publish). Admin data layer swapped to dual-mode: uses Cloudflare when deployed, falls back
  to localStorage otherwise (so the demo never breaks). Verified end to end locally against a real D1.
- **Phase 3 — site reads from the content store.** All **9 content collections migrated and
  parity-checked**: news, products, factory, quality certificates, responsibility certificates,
  contact offices, team, gallery, partners. Build reads `db/seed.json`, or the live published snapshot
  on a Cloudflare build (`scripts/fetch-content.mjs` + `CONTENT_URL`).
- **Phase 0 provisioning (started).** D1 database **created and seeded on the client's Cloudflare
  account** (id in `wrangler.toml`, region WEUR).

## Storage decision (2026-07-26): no R2, no card

R2 is out. Enabling it means completing a subscription checkout that puts a payment method on the
account, and the promise here is no card at all, not a $0 bill. Uploaded pictures now live in D1
alongside the content, and the build writes them out as static files, so visitors are still served
plain files from the CDN. Details and the numbers behind it: "Why not R2" in
`BACKEND_MIGRATION_PLAN.md`.

What keeps that safe long term, and is already built:
- Every upload is scaled and re-encoded to WebP in the browser before it is sent, under 400 KB
  (a 4.6 MB phone photo lands at ~65 KB, measured). The API re-checks type and size.
- Nothing but a picture gets in. No video files, no SVG. Gallery videos are YouTube/Vimeo links.
- The dashboard shows how much of the 500 MB free database the pictures use.

**Still open:** the free Cloudflare Access plan is also reported to ask for a payment method. If it
does, the admin login cannot be Access either and we run our own. Check the real account first.

## In progress / next steps (to go live)
1. **Connect the repo to Cloudflare Pages** (git), bind D1, and set the `CONTENT_URL` build
   variable to this site's own `/content` route.
2. **Admin login** on `/admin` + `/api`: Cloudflare Access if it is genuinely card-free, otherwise
   our own (see above). **This is the hard blocker on going public.** There is no authentication
   code in `functions/api/*` at all: the whole security model assumes Access sits in front, and the
   dashboard's own sign-in screen is a demo gate (password `demo`, a `localStorage` flag) that
   stops nobody. Connecting Pages to a public hostname before this is settled leaves publish,
   upload and delete open to anyone. Both options are written up in `HANDOVER-OPERATIONS.md` §1.
3. **Deploy hook** (Phase 4). The admin's Publish button is built; it needs `DEPLOY_HOOK_URL`
   set as a Pages secret, otherwise it saves the snapshot and warns that nothing rebuilt.
4. ~~**Handover guide** for the client (Phase 5).~~ **DONE (2026-07-29).** Two documents:
   `HANDOVER-CLIENT.md` (plain-language manual for Printopack staff, safe to send as it is) and
   `HANDOVER-OPERATIONS.md` (internal runbook: provisioning state, the login blocker, free-tier
   limits, route reference, recovery). The client guide was written against the real admin UI, so
   its wording matches what is actually on screen.
5. **Domain cutover** (later): GoDaddy DNS - add `www` CNAME + apex forward; email and `api`
   untouched.

## Phase 3 tail, page wiring: DONE (2026-07-26)
Every page now reads its content from the database. Nothing a client would reasonably want to
change is left hardcoded, apart from the navigation, which is a deliberate decision (below).

> **Correction (2026-07-29).** The sentence above was not true when it was written. An audit of
> every `collection()` call against the admin's models found two of the twelve collections were
> not read by any page, so editing them in the dashboard changed nothing on the site:
>
> - **`careers`: FIXED.** `careers.astro` carried its own hardcoded array of three roles. It now
>   reads `collection('careers')` and honours the Status field. Details below.
> - **`products`: FIXED.** The admin had a Products model that no page rendered. `/products/[slug]`
>   now lists the products in its group. Details below.

## Careers wired to the dashboard (2026-07-29)
The Careers page is now driven entirely by the admin, and the model gained the fields the page
needed but never had:

- **New admin fields:** `locationAr` (the location was English-only, so Arabic visitors saw
  "Jeddah, KSA" in a right-to-left sentence), plus `summary` / `summaryAr` (the page has always
  had a summary paragraph; the dashboard had no field for it).
- **Requirements are one per line**, English and Arabic paired by position, so a half-translated
  list still renders one bullet per requirement instead of falling back to English wholesale.
  The admin field hints now say so.
- **Department and Type** stay single English dropdowns in the admin; their Arabic is a lookup in
  the page, so the client does not retype a translation for every role.
- **Status is honoured.** `job-03` (Sales Account Manager) is `draft` in the baseline, so the page
  now shows two roles where it previously showed three. Flip it to `published` in the dashboard to
  bring it back. This is the draft mechanism working, not a regression.
- The richer copy that lived in the hardcoded array (summaries and three requirements per role, in
  both languages) was migrated into `db/seed.json` rather than discarded, and `db/seed.sql` was
  regenerated from it.

## Products wired to the dashboard (2026-07-29)
The admin's Products model now has a surface. `/products/[slug]` lists the products belonging to
that group, under the group narrative and above the Printopack Standard band.

- **Matching:** the model's "Group" field is a dropdown built from the product groups, so it
  stores the group's **English name**, and the page matches on that. No new field, no new route.
- **"Visible on site"** hides a product without deleting it. Anything not explicitly set to
  `false` stays visible, so a newly created product does not silently vanish before the client
  has touched the dropdown. Verified end to end by flipping one product and rebuilding.
- **The section renders only when the group has products.** Nineteen of twenty groups are empty
  today, and an empty band on all of them would be noise. It appears on its own as content lands.
- **No photograph yet is a designed state, not a broken one:** the card falls back to the
  product's initials on a cream tile, the same idea as the team page's monogram.
- **Card:** image or monogram, bilingual name, bilingual description, "Price on request", and an
  Enquire link whose mailto subject names both the product and its group, so an enquiry arrives
  already identified. Catalogue and enquiry only, no cart, consistent with the rest of the site.
- **Sample data:** 4 real bag formats were seeded into "Chips & Snacks" so the feature is
  reviewable while the real catalogue is client-gated. They carry no image on purpose. Flagged in
  `PRODUCTION_TODO.md` for replacement.

With this, **all twelve admin collections are read by the site.** No model in the dashboard writes
to nothing any more.

- [x] **Footer**: company details (phone / email / address / company name) now read the editable
      `settings`, and the regional-offices strip is built from the offices collection. The contact
      details in the top utility strip of the header read the same record.
- [x] **Side menu / header navigation**: **decided: the nav stays in code.** The seven sections are
      the GM's own sitemap and are not expected to be renamed, so the labels and structure stay in
      `Header.astro` rather than adding another surface for the creative manager to manage (and a way
      to point the nav at a page that does not exist). Only the contact details in the top strip are
      editable, from `settings`.
- [x] **Counters** (offices / countries / years / employees / departments / customers): read from
      the editable `about` record via `stats` in `src/lib/content.ts`, on all eight pages that show
      them. The admin's free-text "Years" field became "Year founded", and the years-in-market
      counters count from it to the current year on their own.
- [x] **Company page story** (history / mission / vision): sourced from the `about` record, headline
      plus a body whose blank lines become paragraphs. **Values** became their own collection, so the
      client can reword, reorder, add or remove one.
- [x] **Gallery video tiles**: open the YouTube / Vimeo link when the client sets one (videos are
      external, never hosted here).

## Notes
- The live site is currently unchanged and still builds/deploys as before; all of the above is
  groundwork that switches on once the Cloudflare provisioning (steps 1-4) is complete.
- No secrets are stored in the repo. `wrangler.toml` holds the D1 id (an identifier, not a secret);
  the deploy-hook URL and any tokens live only in Cloudflare's dashboard/secrets.
