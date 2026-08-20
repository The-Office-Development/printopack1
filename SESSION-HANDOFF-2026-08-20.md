> ## CORRECTION added 2026-08-20, later the same day
>
> **This file was accurate when written and is not any more.** A second session has since
> worked in the same tree. Two facts below are now wrong:
>
> | Stated here | Actually on disk |
> |---|---|
> | `HEAD` is `a24d1db` | **`5376ff7 Header and hero: less dead space above the fold, and the photograph at full width`** |
> | 19 modified, 9 new | **30 modified, 19 untracked, 49 total** |
>
> Two commits were merged in from `origin/main` (`5c2a62c` the client's name artwork,
> `5376ff7` the header and hero), and a full second round of client edits was then built on
> top: the 108px section rhythm, the dark-blue bands, the About/Quality/News card treatment,
> the regenerated reach map, the footer rebuild, the contact page changes, and the removal of
> every "these are placeholders" note.
>
> **So the uncommitted work in this tree is roughly twice what the inventory below describes.**
> Everything in this file is still real and still uncommitted; it is simply no longer the whole
> picture. The warning about `checkout` / `switch` / `stash` / `reset --hard` / `clean` applies
> with more force, not less.
>
> If you commit, the message needs to cover both rounds, or read `TASKS.md`, which is current.

# Session handoff, 2026-08-20

Written for whoever picks this up next, including another session working in parallel.

> **READ THIS BEFORE ANY GIT COMMAND.**
> Everything below is **uncommitted**, on branch **`feat/enquiries-and-mailer`**.
> `HEAD` is still `a24d1db` (2026-08-18), unchanged.
> A `git checkout`, `git switch`, `git stash`, `git reset --hard` or `git clean` will destroy
> roughly 1,000 lines of verified work. If you need to move branches, **commit first**.
> There is a second, separate project at `/Users/bader/printopack-mailer` with **no commits
> at all** (`git init` only). Same warning, more so: nothing there is recoverable from git.

---

## 1. What happened, in order

1. A 7-lane audit of this repo plus the SES plan. 93 findings, each re-verified by an
   independent adversarial pass. Report:
   https://claude.ai/code/artifact/35df38df-9101-4922-ba21-31b34a69a574
2. Both criticals and eleven highs fixed here, verified against a local D1.
3. The website's forms joined to a shared contact book, and the client's messaging tool
   ("automation system" / "unify the databases") built as a separate project.

Nothing is deployed. Nothing is committed.

---

## 2. Changed files in THIS repo (`/Users/bader/printopack-v2`)

### The two critical fixes

| File | What changed |
|---|---|
| `functions/api/_shared.js` | **+`'formats'`, `'standard'` to `COLLECTIONS`.** They were missing, so those two admin sections 404'd on every save, delete and reorder in production while the UI showed an optimistic "saved". Also adds `touchContent()` / `lastChangeAt()`, see below. |
| `src/pages/contact.astro`, `src/pages/careers.astro`, `src/components/Footer.astro` | The three forms posted with `data-netlify="true"` (contact, careers) or `onsubmit="return false"` (newsletter). The site is on Cloudflare Pages, so **every submission since the move was lost**. All three now POST to `/api/enquiry` via fetch, with inline success and error states, and the newsletter box is a real subscription. |

### The other fixes

| File | What changed |
|---|---|
| `src/data/news.ts` | Filters `status === 'published'`. Draft posts were going live. |
| `src/pages/news.astro` | Guards `posts[0]`. Deleting the last news post crashed the build. |
| `src/pages/partners.astro` | Guards `offices.int`. Deleting the International Sales office crashed the build. |
| `functions/api/publish.js` | Checks the deploy hook's `res.ok` (a failed rebuild used to report "deployed"), and counts deletions as pending changes. |
| `functions/api/_shared.js` + `[collection].js`, `[collection]/[id].js`, `order/[collection].js`, `singleton/[key].js` | A `site_meta.last_change` stamp on every mutating write, so a delete-only session no longer shows "Everything is live". |
| `scripts/fetch-content.mjs` | Fails the build when `CONTENT_URL` is set and the snapshot fetch fails, instead of silently shipping the stale committed baseline. A failed build leaves the previous deploy serving, which is the safe outcome. |
| `functions/api/upload.js` | Accepts `image/png`, needed by the Safari path below. |
| `public/admin/admin.js` (+511/-46) | The big one. See the breakdown in section 3. |
| `public/admin/admin.css` (+52) | Mobile menu button, scrim, the unsaved-work bar, the enquiries inbox styles. |
| `functions/_middleware.js` | Opens `/api/enquiry` (it is the only open write on the site; its defences are inside the handler). |

### New files

| File | What it is |
|---|---|
| `db/migrations/001_contacts_and_enquiries.sql` | `contacts`, `suppression`, `enquiries`, `enquiry_files`, `form_guard`, `site_meta`. **The shared contact book.** |
| `db/migrations/002_mailer.sql` | `mail_settings`, `mail_auth`, `mail_login_guard`, `mail_templates`, `mail_campaigns`, `mail_recipients`, `mail_events`. |
| `functions/_contacts.js` | `upsertContact()` and the per-IP form throttle. The rules that keep the list safe live here. |
| `functions/api/enquiry.js` | The public form endpoint. Open, honeypot + throttle + type/size limits. |
| `functions/api/enquiries.js` | The inbox list, for the dashboard. |
| `functions/api/enquiries/[id].js` | Mark read / archived, delete. |
| `functions/api/enquiry-file.js` | Attachment download, session-gated, `no-store`, `nosniff`. |
| `src/pages/privacy.astro`, `src/pages/conditions.astro` | Bilingual. Both were linked from every page's footer and 404'd. The privacy page is also the consent notice the mailer needs. |
| `SESSION-HANDOFF-2026-08-20.md` | This file. |

### Documentation updated

- `TASKS.md` — a full "DONE 2026-08-20" section at the top, with what is still open.
- `SES_PRODUCTION_ACCESS.md` — step 5 was one sentence describing work that did not exist;
  it now points at the built tool and carries a checklist of what is genuinely still to do
  before the production-access request is submitted.

---

## 3. `public/admin/admin.js`, changed in detail

Largest blast radius, so itemised:

- **Write reliability layer** (`apiSend`, `runWrite`, `FAILED`, `renderFailBar`, `retryFailed`,
  `openReauth`). Writes were optimistic with a 2.6-second error toast, so an expired 12-hour
  session silently lost an afternoon of edits. Failures are now kept, named, and shown in a
  bar that stays; an expired session opens a password dialog and replays the work.
- **`tsMount()`** — Turnstile extracted so the login screen and the re-auth dialog share it.
- **Enquiries inbox** — `enquiriesView()`, `openEnquiry()`, nav entry, sidebar badge,
  dashboard card. New section, roughly 150 lines.
- **Mobile navigation** — `setNav()`, `bindNavToggle()`, a menu button in `topbar()`.
  The sidebar was off-canvas below 900px with nothing to open it.
- **`CC_OPTIONS`** — the office "country on the map" select is built from `COUNTRIES` and
  shows names. It was a hand-written list missing 8 of 20 codes, so switching on UAE,
  Bahrain, Oman, Qatar, Lebanon, Palestine, Mauritania or Djibouti wiped the map link on the
  first save.
- **`hasAlpha()` + the `prepImage` fallback** — Safari cannot export WebP and was flattening
  transparent logos onto black.
- **`esc()`** — now escapes quotes. A title containing `"` corrupted on save.
- **Product group cascade** — renaming a group carries through to its products; deleting one
  that still holds products is refused with a count.
- **Drawer safety** — dirty-close confirm, `beforeunload` guard, no double-submit.
- **Publish** — the change list is re-fetched when the dialog opens, and the real reason is
  shown when a rebuild was not triggered.
- **`renderView()` split into `renderView()` + `paintView()`** so the nav toggle is re-bound.

---

## 4. The other project: `/Users/bader/printopack-mailer`

**Not a subdirectory of this repo. Separate project, separate deploy, `git init` only, zero
commits.** 24 files, ~3,400 lines.

A Cloudflare **Worker** (not Pages: Pages has no cron trigger, and a several-thousand send
cannot fit in one request), bound to **the same D1 database as this website**.

| Path | What it holds |
|---|---|
| `wrangler.toml` | The Worker, the assets binding, the cron (`* * * * *`), and the D1 binding pointing at `printopack` / `69f1feed-217e-482f-998a-9e7d08294d3b`. |
| `src/index.js` | Router (three surfaces: gated `/api/*`, open `/u`, open `/hooks/ses/<secret>`), the cron handler, hourly housekeeping. |
| `src/auth.js` | Its own single sign-in, separate from this site's. PBKDF2 at 100k (never raise it on Workers), HMAC cookie, per-IP lockout, optional Turnstile. |
| `src/ses.js` | SigV4 by hand. **Verified against AWS's published `get-vanilla` test vector.** Classifies failures retryable / fatal. |
| `src/mime.js` | Raw MIME: RFC 2047 Arabic headers, multipart/alternative, RFC 8058 `List-Unsubscribe-Post`. |
| `src/render.js` | The letter template (RTL-aware), merge fields, the enquiry notification. |
| `src/contacts.js` | Segments, list, import with dedup, CSV export, suppression. |
| `src/campaigns.js` | The draft → queued → sending → done state machine. Queueing freezes the audience. |
| `src/send.js` | One minute's sending, health check, pause rules. |
| `src/notify.js` | Emails the office about each website enquiry. |
| `src/webhook.js` | Amazon's bounce/complaint reports → automatic suppression. |
| `src/unsubscribe.js` | One-click unsubscribe, signed, no login, immediate. |
| `public/` | The dashboard: `index.html`, `app.js` (1,124 lines), `app.css`, `favicon.svg`. |
| `README.md` | Setup order, the AWS side, the invariants. **Read it before changing send.js.** |

### The seven invariants (breaking one is a bug, not a change)

1. A recipient leaves `pending` only after Amazon accepts the message.
2. Suppression is checked per message, not per campaign.
3. A frozen audience never re-runs its filter.
4. Consent is recorded on arrival and never rewritten.
5. An unsubscribe is never undone by an import, an enquiry, or a re-added contact.
6. A configuration failure pauses the campaign; it does not fail the recipients.
7. Every campaign carries a working one-click unsubscribe.

---

## 5. How the two halves join

```
   contact form ─┐
   careers form  ├─► POST /api/enquiry ─┬─► enquiries (+ enquiry_files)
   newsletter   ─┘                      └─► contacts  (email, consent_basis, consent_at)
                                                │
                                     ONE D1: printopack
                                                │
   printopack-mailer, cron every minute ────────┘
     1. email the office about any un-notified enquiry
     2. send the next chunk of the running campaign
```

No import step between them. Only the mailer holds AWS keys, so a mail outage delays a
notification and cannot lose an enquiry.

---

## 6. What was verified, and how

Against a local D1 (`.wrangler/state`), with both dev servers running:

- Bag Formats and The Printopack Standard: save 200, delete 200, reorder 200.
- Publish: `pending=false` after publishing; `pending=true` after a delete-only change, with
  the diff listing `formats: 1 removed`.
- A real browser submission of the contact form → enquiry row with correct routing + contact
  row with `consent_basis: enquiry`.
- Attachment download: 401 unauthenticated, correct headers and bytes when signed in.
- Admin at 375px: sidebar opens to `left:0`, 19 nav items and Publish reachable.
- Import: a Gmail-style CSV counted the website's existing contact as "updated", not added.
- Unsubscribe: forged token 400; one-click POST works; the address is then excluded from
  audiences, survives a re-import, and survives a new enquiry from the same person.
- SNS webhook: hard bounce suppresses the address; a wrong secret 404s.
- SigV4 matches the AWS test vector. MIME passes 15 checks including Arabic round-trip.
- Fatal-error path: bad credentials pause the campaign with all recipients still `pending`.

**Never tested:** a real send through a real SES account. No AWS account exists yet.

---

## 7. What is still open

From the audit, not addressed:

- The dev login bypass still ships (3 `REMOVE BEFORE LAUNCH` markers).
- Placeholder partners, "Name Name" managers, and the live test records.
- `HANDOVER-CLIENT.md` still documents the Cloudflare Access email login that was never
  built, and there is no Arabic edition for a GM who works in Arabic.
- `db/README.md` still calls its seed load safe; running it now wipes live content.
- Uploaded pictures are never deleted from D1.
- Edits made to committed `db/seed.json` do not reach production (`CONTENT_URL` wins), so
  the 2026-08-18 "average experience 14.5" fix is still not live.

Deployment, in order:

1. **Migrations first, before deploying the site.** Otherwise the forms return a polite
   "email us directly" instead of storing anything.
   `npx wrangler d1 execute printopack --remote --file db/migrations/001_contacts_and_enquiries.sql`
   then `002_mailer.sql`.
2. Deploy the site, publish, confirm an enquiry lands in the dashboard.
3. The mailer's whole Amazon side (account in Printopack's name, domain + DKIM, MAIL FROM,
   DMARC, IAM user, configuration set, SNS subscription, secrets, `wrangler deploy`).
   Order is in the mailer's README and it matters.
4. Sandbox checklist, then the SES production-access request, then quote the client.

---

## 8. Local state you may trip over

- `printopack-v2/.wrangler/state` holds a local D1 with **test rows I inserted** (fake
  enquiries, contacts, one campaign, suppression entries). Local only, never deployed.
- `printopack-mailer/.dev.vars` holds **fake** AWS keys and local secrets. Gitignored.
- The mailer's local dev server shares this repo's D1 via
  `npx wrangler dev --persist-to ../printopack-v2/.wrangler/state`.
- `POST /api/tick` on the mailer runs one cron cycle by hand.
