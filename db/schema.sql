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
