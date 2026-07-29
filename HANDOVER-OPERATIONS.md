# Printopack: operations runbook (internal)

For whoever holds the Cloudflare account and anyone picking this project up later. The
client-facing manual is `HANDOVER-CLIENT.md` and can be sent to Printopack as it is. This file
should not be.

Companion documents: `BACKEND_MIGRATION_PLAN.md` (why the architecture is what it is),
`db/README.md` (loading the database), `STATUS.md` (progress), `PRODUCTION_TODO.md` (pre-launch
cleanup).

---

## 1. BLOCKER: there is no application-level authentication

Read this before connecting anything to a public URL.

`functions/api/*` contains **no authentication code at all**. Every handler runs whatever it is
asked to run. The security model is entirely edge-based: the assumption written into
`functions/api/_shared.js` is that Cloudflare Access gates `/api/*` and `/admin*` before a
request ever reaches a Function.

If Pages goes live without Access actually configured, then anonymously, with no credential:

- `GET /api/bootstrap` returns the entire content set
- `POST /api/upload` writes arbitrary images into the database until the 500 MB is gone
- `PUT /api/order/:collection` and `POST`/`DELETE` on `/api/:collection` rewrite or delete all content
- `POST /api/publish` pushes whatever is in the database live and burns build quota

The dashboard's own sign-in screen is **not** a defence. `public/admin/admin.js` renders a login
form with the password prefilled as `demo`, and submitting it only sets a `localStorage` flag
(`loggedIn()` checks `localStorage.pp_admin_session === '1'`). It is a demo gate. It stops
nobody, and when the backend is reachable the app sets that flag itself on boot, on the stated
assumption that Access already authenticated the user.

**Therefore:** do not attach this to a public hostname until the login is genuinely resolved.

### The decision that is still open

`BACKEND_MIGRATION_PLAN.md` section 6 flags it: the free Zero Trust plan is reported (in
community posts, not in Cloudflare's own documentation) to ask for a payment method when
selected. If that is true, Access falls to the same rule that removed R2: no card on the
account, so it cannot be used.

Two paths, and the choice belongs to Bader:

**A. Cloudflare Access, if it is genuinely card-free.** Nothing to build. Add
`gm@printopack.com.sa` and whoever else the GM names to the allow list, put an Access policy over
`/admin*` and `/api/*`, and delete the demo login screen from `admin.js`. This is the preferred
outcome: no authentication code in the live path is the safest authentication code.

**B. Our own login, if Access asks for a card.** A Pages Function issuing a signed session
cookie, a shared or per-user credential, and a middleware over `/api/*` that rejects anything
unsigned. More code in the live path, and it becomes ours to keep correct. Roughly a day of work
including the session handling, logout, and making the admin honour a real 401.

**Check the real account first.** Do not build B on the strength of a forum post.

Either way, one cleanup is required and is not optional: **remove the demo login from
`admin.js`** (`renderLogin`, `SKEY`, `loggedIn`). Leaving a form whose password is `demo` on a
live site is indefensible even behind Access, because it teaches the client that it is the
security boundary.

Note that `/content` and `/media/:key` are intentionally public and must stay outside any login:
the build fetches them with no session and no database binding. Neither exposes anything private.
`/content` serves only the published snapshot, never the draft.

---

## 2. Where provisioning stands

Done:
- D1 database created on the client's Cloudflare account, id in `wrangler.toml`, region WEUR.
- Schema and seed files ready (`db/schema.sql`, `db/seed.json`, `db/seed.sql`).
- The whole API and the admin's data layer, verified locally against a real D1.
- Every page reads from the content store.

Not done, all of it in the dashboard and none of it possible from the repository:

1. **Connect the repo to Cloudflare Pages** and bind the database as `DB`.
2. **Resolve the login** (section 1). This gates going public.
3. **Set the `CONTENT_URL` build variable** to the site's own `/content` route, for example
   `https://printopack.pages.dev/content`. Without it the build silently uses the committed
   `db/seed.json` baseline and the client's edits never reach the public site, with no error.
4. **Set `DEPLOY_HOOK_URL`** as a Pages secret (`wrangler pages secret put DEPLOY_HOOK_URL`).
   Without it, Publish saves the snapshot and the dashboard warns the client that nothing
   rebuilt. This is handled gracefully rather than silently, but it must be set before handover.
5. **Load the database**, following `db/README.md`. Note that `db/seed.sql` opens with
   `DELETE FROM entries` and is safe **only** while nobody has used the live admin.
6. **Domain cutover** at GoDaddy: add the `www` CNAME and the apex forward. Leave the `email`
   and `api` records alone, they belong to the existing systems.

---

## 3. Hosting: one inconsistency to settle

The repository currently carries **both** `netlify.toml` and `wrangler.toml`. The agreed target
is Cloudflare Pages, for one vendor and one client login, but Netlify is what has been building
the site to date.

`netlify.toml` has deliberately been left in place so nothing that is currently deploying breaks.
Once Pages is connected and verified serving, delete `netlify.toml` and disconnect the Netlify
project, otherwise two services rebuild from the same branch and it becomes unclear which one
the domain is pointed at.

Note that a Netlify build has no `CONTENT_URL` and no database binding, so it always produces the
committed `db/seed.json` baseline. That is correct behaviour for a preview, but it means a
Netlify deployment will never show the client's edits. Do not debug that as a fault.

---

## 4. How a publish actually flows

```
admin saves      -> /api/*        -> D1 entries + singletons   (draft, instant, private)
admin publishes  -> /api/publish  -> D1 published (snapshot) + POST to DEPLOY_HOOK_URL
Pages rebuild    -> npm run build -> scripts/fetch-content.mjs:
                                       fetch CONTENT_URL          -> overwrite db/seed.json
                                       fetch /media/<key> for each -> write public/uploads/
                 -> astro build   -> dist/  (static HTML + static pictures)
visitor          -> CDN files only. Never touches D1.
```

Two deliberate properties:
- The build overwrites `db/seed.json` **in the ephemeral build workspace**, never in git.
- Pictures are copied out once per publish rather than served from `/media/` per view, because
  static files are unmetered while every Function request counts against the daily quota.

Failure behaviour is soft by design: if `CONTENT_URL` is unreachable the build warns and falls
back to the committed seed; if one picture is missing the build warns, names it, and continues
rather than failing the whole site.

---

## 5. Free-tier limits and what actually happens at them

| Limit | Value | Reality |
|---|---|---|
| D1 database size | 500 MB | Pictures are the only unbounded growth. Compressed to roughly 65 KB each, so thousands. Surfaced to the client on the dashboard via `/api/storage`. |
| D1 row reads | 5 M/day | The public site reads zero. Only the admin and the build read. |
| D1 bound value | 2 MB | Upload ceiling is 600 KB (`functions/api/upload.js`), well under. |
| D1 SQL statement | 100 KB | Image bytes are passed as bound parameters, never inlined. |
| Pages builds | 500/month | One per publish. A busy month might be thirty. |
| Functions requests | 100 k/day | Admin and build only, because pictures are served statically. |

Nothing here meters, bills or pauses under this site's load. Supabase was rejected specifically
because its free database pauses when idle and needs a manual restore, which would lock the
client out with no developer.

---

## 6. Route reference

| Route | Method | Purpose | Must be gated |
|---|---|---|---|
| `/api/bootstrap` | GET | Whole content set for the admin to load once | Yes |
| `/api/:collection` | GET, POST | List and create | Yes |
| `/api/:collection/:id` | PUT, DELETE | Update and delete | Yes |
| `/api/singleton/:key` | GET, PUT | `about` and `settings` | Yes |
| `/api/order/:collection` | PUT | Store the client's drag order | Yes |
| `/api/upload` | POST | Store a picture in D1 | Yes |
| `/api/publish` | GET, POST | Publish state, and publish | Yes |
| `/api/storage` | GET | Picture usage for the dashboard meter | Yes |
| `/content` | GET | Published snapshot, for the build | **No, must stay public** |
| `/media/:key` | GET | One picture, for the build and admin previews | **No, must stay public** |

Collections: `news`, `productGroups`, `products`, `team`, `careers`, `partners`, `factory`,
`quality`, `responsibility`, `gallery`, `offices`, `values`. Singletons: `about`, `settings`.

---

## 7. Content state at handover

116 records across 12 collections: careers 3, factory 6, gallery 14, news 16, offices 15,
partners 20, productGroups 20, products 0, quality 4, responsibility 6, team 8, values 4.

**`products` is 0 on purpose.** The old site's catalogue was empty, so products are net-new
content, not a migration. Product groups exist and the pages render correctly with an empty
catalogue.

Still carrying placeholders that need real content before or shortly after launch, all of it
listed in `PRODUCTION_TODO.md`:
- The admin-workflow helper notes on several pages must be stripped before launch. They explain
  the CMS to us and were never meant for visitors.
- 12 of 15 office manager names are `Name Name`. Three are real, from business cards.
- Owner names and photographs, team details, product descriptions.
- The GM's final Arabic sign-off on the drafted vision and mission.

---

## 8. Recovery

**The client deleted something and published.** The previous snapshot is gone, but the committed
`db/seed.json` is the launch baseline and every picture is still in the `media` table (nothing
deletes rows there). Re-insert the specific record with a targeted `INSERT`. Do not re-run
`db/seed.sql`, it deletes everything the client has added since launch.

**A publish went out with wrong content.** Fix the content in the admin and publish again. It is
one to two minutes. There is no rollback button and it is not worth building one.

**The site builds but shows stale content.** `CONTENT_URL` is unset or unreachable. Check the
build log: `scripts/fetch-content.mjs` prints exactly which path it took.

**Pictures are missing after a build.** The build log names each key it could not fetch. The
bytes are still in D1; a rebuild usually clears it.

**Publishing reports that nothing rebuilt.** `DEPLOY_HOOK_URL` is unset. The snapshot is saved,
so setting the secret and pressing Publish again is the whole fix.
