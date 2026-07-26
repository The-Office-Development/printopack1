# Printopack: Backend Migration Plan (Cloudflare)

Goal: move the site's content out of hardcoded files and into a real, free, self-managed
backend so Printopack can edit everything themselves for years, with no developer and no fees.
The public site stays static (fast, SEO, luxury). This document is the agreed shape before code.

---

## 1. Principles (why the choices below)

- **No developer, ever.** Nothing in the live path may have a failure mode that only a
  developer can clear. (This is why we are NOT using Supabase: its free database pauses when
  idle and needs a manual "Restore" that would lock the client out.)
- **No fees, ever.** Everything sits on Cloudflare's free tier, which is generous far beyond a
  brochure site's needs and does not meter or pause the way we care about.
- **Keep the admin we built.** The bilingual, branded dashboard stays; only its data layer
  changes (from browser localStorage to the real backend).
- **Keep the site static.** Visitors always get pre-built HTML. Only the admin talks to the
  live backend; visitors never do.

---

## 2. The stack

All on Cloudflare, one vendor, one account, one login for the client:

| Piece | What it does | Free-tier reality |
|---|---|---|
| **Cloudflare Pages** | Hosts the static Astro site + runs the small API (Pages Functions) | Static requests free and unmetered; 500 builds/month; 20,000 files; 25 MiB per file |
| **D1** (SQLite) | All content the admin edits, the uploaded pictures, and the published snapshot | 500 MB database, 5 M row reads/day, 100 k row writes/day; **does not pause** |
| **Access** (Zero Trust) | The login wall in front of the admin | Free up to 50 users, but see the note below |
| **Deploy Hook** | A URL that triggers a site rebuild when the client hits "Publish" | Free |

(We move hosting from Netlify to Cloudflare Pages so everything is one vendor. The GitHub repo
`Heath114/printopack1` stays the source; Cloudflare Pages builds from it.)

### Why not R2

R2 is the obvious home for uploaded pictures, and its free tier is generous (10 GB, free egress).
We are not using it, because turning R2 on means completing a subscription checkout that puts a
**payment method on the account**, and the agreement with this client is that the site costs
nothing and no card is committed on our side. A $0 invoice is not the same promise as no card.

So pictures live in D1 instead, and the constraint that replaces "10 GB of object storage" is
**500 MB of database**. That is not as tight as it sounds, because of the two rules below:

- The admin resizes and re-encodes every upload in the browser before it is sent (WebP, scaled to
  the size printed on the field, stepped down until it is under 400 KB). A 4.6 MB photo straight
  off a phone arrives as roughly 65 KB. At that size 500 MB is thousands of pictures, and the
  dashboard shows the client how much they have used.
- **No video is ever uploaded.** Video is the one thing that would eat the allowance in an
  afternoon, so the gallery takes a YouTube or Vimeo link and a poster image, and the upload
  endpoint refuses anything that is not a JPEG, PNG, GIF or WebP.

D1 caps a single SQL statement at 100 KB but allows a bound value of 2 MB, so image bytes are
passed as bound parameters, never inlined into SQL.

**Note on Access:** the free Zero Trust plan also appears to ask for a payment method when you
select it in the dashboard. This is not stated in Cloudflare's documentation, only in community
reports, so it needs checking against the real account before Phase 0. If it does ask, the admin
login has to be something we run ourselves instead, and that decision belongs to Bader.

---

## 3. How content flows (the important part)

```
CLIENT EDITS (admin, behind the login)
      |  save            (pictures are resized in the browser first)
      v
  /api/*  --->  D1:  entries + singletons (the draft)
      |              media    (the picture bytes)
      |
CLIENT CLICKS "PUBLISH TO LIVE SITE"
      |
  /api/publish: copy the whole content set into D1 `published`
      |          then call the Deploy Hook
      v
  Cloudflare Pages REBUILD
      |  1. fetch /content        -> the published snapshot (no login needed)
      |  2. fetch /media/<key>    -> each picture, written to public/uploads/
      v
  Static HTML + static pictures deployed  --->  PUBLIC VISITORS
                                                (CDN files; they never touch D1)
```

Two states on purpose:
- **Draft (D1 entries/singletons):** every save is instant and visible in the admin. The client
  can make ten edits and nothing is live yet.
- **Published (D1 `published` + rebuild):** one "Publish" button pushes the current content live
  in ~1-2 minutes. This avoids a rebuild on every keystroke and gives a real "published version."

Why the snapshot instead of the build reading the draft directly: the build gets one public JSON
file and needs no token or database binding, and "what I am editing" stays separate from "what is
live."

**Why the pictures are copied out at build time.** They could be served from `/media/<key>` on
every page view, but every one of those is a Function request against a 100,000/day free quota,
while a static file on the CDN is free and unmetered. Writing them into the deployment once per
publish means the database is read a few dozen times a week rather than on every visit, and the
site keeps working exactly as fast as it does today.

---

## 4. Data model (D1)

The admin is schema-driven (each model is a list of fields), so we mirror that with two generic
tables instead of one table per model. This maps almost 1:1 to today's localStorage shape.

```sql
-- collections: news, products, productGroups, team, careers, partners,
-- factory, quality, responsibility, values, gallery, offices
CREATE TABLE entries (
  collection TEXT NOT NULL,
  id         TEXT NOT NULL,
  data       TEXT NOT NULL,          -- JSON: the whole record (bilingual fields, image paths, etc.)
  sort       INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (collection, id)
);

-- singletons: about (home/about + counters), settings (company details)
CREATE TABLE singletons (
  key  TEXT PRIMARY KEY,             -- 'about' | 'settings'
  data TEXT NOT NULL,                -- JSON object
  updated_at INTEGER NOT NULL
);

-- uploaded pictures (this is what replaces R2)
CREATE TABLE media (
  key        TEXT PRIMARY KEY,       -- <id>.<ext>; served at /uploads/<id>.<ext>
  mime       TEXT NOT NULL,
  bytes      BLOB NOT NULL,          -- bound parameter, never inlined: 2 MB cap per value
  size       INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- the last "Publish": what the build reads, kept apart from the draft above
CREATE TABLE published (
  key        TEXT PRIMARY KEY,       -- always 'content'
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

Storing each record as a JSON blob means adding a field later (in the admin schema) needs no
database migration. Good for a system meant to run untouched.

---

## 5. The API (Cloudflare Pages Functions)

Small, behind the admin login. Bound to D1 only.

- `GET  /api/:collection`            list records
- `POST /api/:collection`            create/update a record
- `DELETE /api/:collection/:id`      delete a record
- `GET/PUT /api/singleton/:key`      read/write about + settings
- `POST /api/upload`                 store a picture in D1, return the /uploads/... path it will live at
- `GET  /api/storage`                how much of the 500 MB the pictures use (dashboard meter)
- `POST /api/publish`                copy the content set into `published`, then call the Deploy Hook

Two more routes sit deliberately **outside** `/api`, because the Pages build has to read them and
a build has no login and no database binding. Both are read-only and serve only published,
already-public content:

- `GET  /content`                    the published snapshot
- `GET  /media/:key`                 one uploaded picture, for the build (and for admin previews
                                     of a picture that has not been published yet)

The admin's existing data functions (`db/save/coll/setColl/obj/setObj`) are rewritten to call
these endpoints. The rest of the admin UI is unchanged.

---

## 6. Login (client experience)

**Open question, must be settled in Phase 0:** the plan below assumes Cloudflare Access, but
selecting the free Zero Trust plan is reported to ask for a payment method. If it does, Access is
out on the same grounds as R2, and the alternative is a login we run ourselves in a Pages
Function: a password the client sets, checked against a hash held as a Pages secret, issuing a
signed session cookie. That is more code in the live path and worth avoiding if Access turns out
to be genuinely card-free, so check the real account first.

Cloudflare Access protects `/admin` and the write API. Method: **one-time email PIN**.
The client opens the admin, types their email, receives a 6-digit code, enters it, and is in for
the session. No password to forget or reset. Fully self-service. We add the GM's email (and any
others he names) to the Access allow-list. The old demo login screen is removed.

Customer login (the existing button that points to their Azure POS portal) is unchanged; it is an
external link, not part of this backend.

---

## 7. Images

The client picks a photo in the admin. Before anything is sent, the browser scales it to the size
printed on the field, re-encodes it as WebP and steps the quality down until it is under 400 KB;
a 4.6 MB phone photo becomes about 65 KB. `/api/upload` checks the type and size again, stores the
bytes in D1 `media`, and returns `/uploads/<key>`, which is what the record saves.

At the next Publish the build downloads each picture once and writes it into the deployment, so
the live site serves ordinary static files. Between an upload and a publish the admin previews it
through `/media/<key>`, since the static file does not exist yet.

Refused outright: SVG (it can carry script and would run on our own origin) and anything that is
not a picture. Video is a YouTube or Vimeo link, never a file.

---

## 8. Phases (each is independently testable; the site stays live throughout)

- **Phase 0 - Provisioning (Malek, in the Cloudflare dashboard).** Create account and D1, connect
  the repo to Pages, set up the admin login, create the Deploy Hook. No R2 and no storage
  subscription. See section 9.
- **Phase 1 - Schema + seed (Claude). DONE.** `db/schema.sql` (entries + singletons), `db/seed.json`
  (116 records across 12 collections + about/settings singletons, all real finalized content),
  `db/build-seed-sql.mjs` -> `db/seed.sql`. Counts verified.
- **Phase 2 - API + admin swap (Claude). DONE + verified locally.** Pages Functions in `functions/api/`
  (bootstrap, list/upsert, delete, singleton read/write, picture upload to D1, storage meter,
  publish, plus the public /content and /media/:key read routes). Admin data
  layer swapped to a dual-mode adapter (uses /api when the backend is reachable, falls back to
  localStorage otherwise, so the demo never breaks). Verified end to end with `wrangler pages dev`
  + a local D1 seeded from db/seed.sql: bootstrap returned all content, a create/read/delete
  roundtrip passed, and the admin loaded in API mode (16 news, 15 offices) with no errors. The
  live-deploy verification still happens once Phase 0 provisioning is done.
- **Phase 3 - Site reads content (Claude). IN PROGRESS.** Foundation done: `src/lib/content.ts`
  (imports db/seed.json baseline, or the live snapshot), `scripts/fetch-content.mjs` prebuild
  (refreshes seed.json from CONTENT_URL on Cloudflare builds), and `package.json` build chains it.
  Pages migrated + parity-verified: **News** (src/data/news.ts) and **Products** (src/data/products.ts).
  Remaining pages to point at the content source (same pattern, structural copy stays templated):
  partners, factory, gallery, contact offices directory, quality certificates, responsibility
  certificates, team, and the singletons (home/company counters + about story from `about`; footer
  from `settings`).
- **Phase 4 - Publish button (Claude).** Wire the admin "Publish" button to `/api/publish`. Verify
  edit -> publish -> live in ~1-2 min.
- **Phase 5 - Handover (Claude).** Write the client + Malek handover guide (how to log in, edit,
  publish, recover), and a short recovery note. Final full verification.

Rollback at any point: the current static content stays in git until Phase 3 swaps it, and D1 +
git history are both recoverable.

---

## 9. Who does what

**Malek (Cloudflare dashboard - I cannot do these; they need account access):**
1. Create/confirm a Cloudflare account (free).
2. Create a **D1** database (note its name/ID).
3. In **Pages**, connect the GitHub repo `Heath114/printopack1`, set the build command
   (`npm run build`) and output (`dist`).
4. Bind D1 to the Pages project (Settings -> Functions -> bindings). There is no R2 bucket and no
   storage subscription to enable; see "Why not R2".
5. Set the `CONTENT_URL` build variable to this site's own `/content` route.
6. Set up the admin login over `/admin*` and `/api/*`. The plan is **Access (Zero Trust)** with a
   one-time email PIN, but check first whether selecting the free plan asks for a payment method.
   If it does, this becomes our own login instead (see section 6).
7. Create a **Deploy Hook** URL and add it as the `DEPLOY_HOOK_URL` Pages secret.
8. Decide **ownership/handover**: keep the Cloudflare project under The Office and give Printopack
   only the Access login, or transfer the project to a Printopack-owned account at the end.

I can hand you the exact click-path and any `wrangler` CLI commands for each of these, and if you
run `wrangler login` yourself in this session I can execute the CLI steps (schema load, seed
import, bindings via `wrangler.toml`) for you.

**Claude (in the repo):** everything in Phases 1-5 above (schema SQL, seed import script, the API
Functions, the admin data-layer rewrite, the Astro build-from-snapshot refactor, the publish
wiring, `wrangler.toml`/Pages config, and the handover docs).

---

## 10. Decisions assumed (tell me if any is wrong)

1. **All-Cloudflare** (move hosting off Netlify to Cloudflare Pages). Alternative: keep Netlify and
   use Cloudflare only for the backend, but that is two vendors and more moving parts.
2. **Manual "Publish" button** (batch edits, one rebuild). Alternative: auto-rebuild on every save.
3. **Generic JSON tables** in D1 (no per-model migrations later).
4. **One-time email PIN** login via Access.
5. Custom domain is a later, separate step; we launch on the free `*.pages.dev` URL first.

---

## 12. Domain cutover (from a public DNS lookup, done 2026-07)

Their real setup (all public):
- **DNS/registrar: GoDaddy** (`ns07/ns08.domaincontrol.com`).
- **Email: Microsoft 365 via GoDaddy** — MX `printopack-com-sa.mail.protection.outlook.com`,
  SPF `v=spf1 include:secureserver.net -all`, verification `MS=ms97281972`. No DKIM/DMARC set.
- **Web (apex + www + `api`)** all resolve to GoDaddy `72.167.69.115`. www is a CNAME to the apex.
- Customer portal is on Azure (`printopack.azurewebsites.net`), a separate domain, unaffected.

**Recommended cutover: keep DNS at GoDaddy, change only two records.** Their email and their `api`
subdomain live in this GoDaddy zone, so moving nameservers to Cloudflare would risk breaking mail.
Instead:
1. `www.printopack.com.sa` -> CNAME to the Cloudflare Pages target.
2. `printopack.com.sa` (apex) -> GoDaddy Forwarding, 301 to `https://www.printopack.com.sa`
   (GoDaddy cannot CNAME an apex).

Leave MX, SPF, the `MS=` TXT, autodiscover, and the `api` record untouched. Canonical becomes
`www.`. Old GoDaddy site keeps serving until the flip, so no downtime. SSL is automatic.

Exceptions to confirm with the client:
- If he wants the bare apex `printopack.com.sa` (no `www`) as the canonical address, that forces a
  nameserver move to Cloudflare, and then we must carefully re-create the M365 email records.
- Before anyone cancels the old GoDaddy web hosting, confirm `api.printopack.com.sa` is not served
  from that same box, or the API goes down.

This does not affect Phases 1-5; it only makes the final domain step concrete.

## 11. Why this needs no developer later (the whole point)

- No product on the account that bills or asks for a card. D1 and Pages are free, and the public
  site is static files on a CDN.
- The client logs in with an email code, edits in the same admin, clicks Publish. No terminal, no
  code, no rebuild knowledge required.
- Content and pictures live in D1 (with 7 days of D1 Time Travel), the last publish is kept as its
  own snapshot row, every deployment is retained by Pages, and the code lives in git. Several
  independent recovery paths. Nothing is trapped in a single fragile place.
