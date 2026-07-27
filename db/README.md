# Loading the database

The D1 database already exists on the client's Cloudflare account (id in `wrangler.toml`), but it
was created and seeded **before** R2 was dropped, so it is missing the two tables that replaced it
and the content added since. Two separate jobs, and only the second one is destructive.

Run these from the repo root, signed in as the account that owns the database:

```sh
npx wrangler login
```

## 1. Schema (safe, run any time)

```sh
npx wrangler d1 execute printopack --remote --file=db/schema.sql
```

Adds the `media` table (uploaded pictures, what replaced R2) and `published` (the last Publish).
Every statement is `CREATE TABLE IF NOT EXISTS`, so existing rows are untouched and running it
twice does nothing the second time. Verified against a copy of the old schema with content in it:
the tables appear, the content survives, and a repeat run is a no-op.

## 2. Content (destructive: read this first)

```sh
npx wrangler d1 execute printopack --remote --file=db/seed.sql
```

`seed.sql` opens with `DELETE FROM entries` and `DELETE FROM singletons`, so it **replaces all
content** with the current `db/seed.json`: 116 records across 12 collections, plus `about` and
`settings`.

This is safe right now only because Cloudflare Pages is not connected yet, so nobody can have
edited anything through the live admin. **That stops being true the moment the client starts
using it.** After that, this file is an initial load and nothing else, and new content has to go
in through the admin or a targeted `INSERT`.

What the reload adds over what is in the database today: the `values` collection (4 records), and
the newer `about` / `settings` fields, `statFounded`, `statCustomers`, `companyAr`, `addressAr`,
`addressShort`, `addressShortAr`.

## 3. Check it worked

```sh
npx wrangler d1 execute printopack --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

npx wrangler d1 execute printopack --remote --command \
  "SELECT collection, COUNT(*) AS n FROM entries GROUP BY collection ORDER BY collection;"
```

Expect four tables (`entries`, `media`, `published`, `singletons`) and 116 entries in total:
careers 3, factory 6, gallery 14, news 16, offices 15, partners 20, productGroups 20, products 0,
quality 4, responsibility 6, team 8, values 4.

`products` being 0 is correct: the product list is the content Amal's classification email is
about, and it has not been built yet.

## Still to do in the dashboard, after the above

- Connect the repo to Pages and bind the database as `DB`.
- Set the `CONTENT_URL` build variable to the site's own `/content` route.
- Set `DEPLOY_HOOK_URL` as a Pages secret, or the admin's Publish button saves a snapshot and
  warns that nothing rebuilt.

## Regenerating seed.sql

`db/seed.json` is the source of truth. After editing it:

```sh
node db/build-seed-sql.mjs
```
