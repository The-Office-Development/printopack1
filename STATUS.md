# Printopack — current status

_Last updated: 2026-07-23_

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
- **Phase 1 — content schema + seed.** `db/schema.sql` + `db/seed.json` (all real content: 112
  records across 11 collections + `about`/`settings`) + `db/seed.sql` generator.
- **Phase 2 — backend API + admin swap.** `functions/api/*` (list/create/delete, singletons, image
  upload, publish). Admin data layer swapped to dual-mode: uses Cloudflare when deployed, falls back
  to localStorage otherwise (so the demo never breaks). Verified end to end locally against a real D1.
- **Phase 3 — site reads from the content store.** All **9 content collections migrated and
  parity-checked**: news, products, factory, quality certificates, responsibility certificates,
  contact offices, team, gallery, partners. Build reads `db/seed.json`, or the live published snapshot
  on a Cloudflare build (`scripts/fetch-content.mjs` + `CONTENT_URL`).
- **Phase 0 provisioning (started).** D1 database **created and seeded on the client's Cloudflare
  account** (id in `wrangler.toml`, region WEUR).

## In progress / next steps (to go live)
1. **R2**: either enable it in the dashboard (free tier, card on file, $0) or choose the no-card route
   (store uploaded images in the database). Then create the bucket + set its public URL.
2. **Connect the repo to Cloudflare Pages** (git) and set the `CONTENT_URL` build variable.
3. **Cloudflare Access** login (email code) on `/admin` + `/api`.
4. **Deploy hook + admin "Publish" button** (Phase 4).
5. **Handover guide** for the client (Phase 5).
6. **Domain cutover** (later): GoDaddy DNS — add `www` CNAME + apex forward; email and `api` untouched.

## TODO — remaining page wiring (Phase 3 tail)
- [ ] **Footer** — wire the company details (phone / email / address / company name) to the editable
      `settings` so the client can update them from the admin.
- [ ] **Side menu / header navigation** — review and wire the nav (labels / structure) to editable
      content so it is admin-managed like the rest.
- [ ] **Counters** (offices / countries / years / employees) — read from the editable `about` values
      across the pages that show them.
- [ ] **Company page story** (history / mission / vision / values) — source from the `about` singleton.
- [x] **Gallery video tiles** — open the YouTube / Vimeo link when the client sets one (videos are
      external, never hosted here).

## Notes
- The live site is currently unchanged and still builds/deploys as before; all of the above is
  groundwork that switches on once the Cloudflare provisioning (steps 1-4) is complete.
- No secrets are stored in the repo. `wrangler.toml` holds the D1 id (an identifier, not a secret);
  the deploy-hook URL and any tokens live only in Cloudflare's dashboard/secrets.
