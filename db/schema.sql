-- Printopack content database (Cloudflare D1 / SQLite)
-- Two generic tables mirror the schema-driven admin, so adding a field later in the admin
-- never needs a database migration (each record is a JSON blob).

CREATE TABLE IF NOT EXISTS entries (
  collection TEXT NOT NULL,          -- news | productGroups | products | team | careers |
                                     -- partners | factory | quality | responsibility |
                                     -- gallery | offices | values
  id         TEXT NOT NULL,
  data       TEXT NOT NULL,          -- JSON: the full record (bilingual fields, image URLs, ...)
  sort       INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (collection, id)
);
CREATE INDEX IF NOT EXISTS idx_entries_collection ON entries (collection, sort);

CREATE TABLE IF NOT EXISTS singletons (
  key        TEXT PRIMARY KEY,       -- about | settings
  data       TEXT NOT NULL,          -- JSON object
  updated_at INTEGER NOT NULL
);

-- Uploaded pictures. They live here rather than in object storage so the whole site runs
-- on the Workers free plan with no payment method on the account. The admin compresses
-- every upload in the browser first (see IMG_MAX_KB), and D1 allows 2 MB per row, so an
-- image is never close to the cap. These rows are read only at build time: the build
-- writes each one out as a real file under /uploads/, and visitors are then served static
-- files from the CDN, never this table.
CREATE TABLE IF NOT EXISTS media (
  key        TEXT PRIMARY KEY,       -- <id>.<ext>; the site serves it at /uploads/<id>.<ext>
  mime       TEXT NOT NULL,
  bytes      BLOB NOT NULL,
  size       INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- The last "Publish". Editing writes to entries/singletons immediately (the draft the admin
-- shows); pressing Publish copies the whole content set here and rebuilds the site from it.
-- That is what keeps drafts off the live site without needing a second database.
CREATE TABLE IF NOT EXISTS published (
  key        TEXT PRIMARY KEY,       -- always 'content'
  data       TEXT NOT NULL,          -- the full { entries, singletons } snapshot as JSON
  updated_at INTEGER NOT NULL
);

-- Admin auth kept editable at runtime. The marketing password is a hash in the 'pass_hash'
-- row here, so the client can rotate it from the dashboard with no developer and no secret
-- redeploy. Until this row exists, login falls back to the ADMIN_PASS_HASH Pages secret (the
-- initial/bootstrap password); the first in-app change writes the row and takes over. Recovery
-- if the password is lost: DELETE this row and log in again with the bootstrap secret.
CREATE TABLE IF NOT EXISTS auth (
  key        TEXT PRIMARY KEY,       -- 'pass_hash'
  value      TEXT NOT NULL,          -- pbkdf2$<iter>$<salt>$<hash>
  updated_at INTEGER NOT NULL
);

-- Login rate limiting. Without Cloudflare Access there is one shared password, so /api/login
-- counts failures per client IP and locks that IP out for a cooldown after too many, to blunt
-- online guessing. A success clears the row. (Distributed guessing across many IPs is handled
-- by Turnstile on the login form, if enabled.)
CREATE TABLE IF NOT EXISTS login_guard (
  ip           TEXT PRIMARY KEY,
  fails        INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL
);
