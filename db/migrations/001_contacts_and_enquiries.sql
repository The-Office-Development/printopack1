-- Printopack: the shared contact book, the website's enquiry inbox, and the mailer.
--
-- This is the migration that joins the two halves of the system together. It runs on the
-- SAME D1 database the website content already lives in (`printopack`), which is the whole
-- point: an address typed into a form on the website IS a contact in the mailing tool, in
-- the same database, in the same second. There is no export, no second list to keep in step,
-- and nothing for anyone to remember to do. "Unify the databases", in the client's words.
--
-- Safe to run more than once: every statement is IF NOT EXISTS, and nothing here touches the
-- content tables (entries, singletons, media, published, auth, login_guard).
--
--   wrangler d1 execute printopack --remote --file db/migrations/001_contacts_and_enquiries.sql

-- ---------------------------------------------------------------------------------------
-- 1. The shared contact book. Written by the website's forms, read and sent by the mailer.
-- ---------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id            TEXT PRIMARY KEY,
  -- Lowercased and trimmed before it is stored, so the same person cannot arrive twice as
  -- Sales@x.com and sales@x.com. This uniqueness is what makes "unify the databases" hold.
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  name_ar       TEXT,
  company       TEXT,
  phone         TEXT,
  country       TEXT,
  -- Which language this person is written to in. Set from the language they used the site in.
  lang          TEXT NOT NULL DEFAULT 'en',
  -- Where the address came from: website_enquiry | website_careers | newsletter | import | manual
  source        TEXT NOT NULL,
  -- WHY it is lawful to write to them. Saudi PDPL and every mailbox provider ask this
  -- question, and the answer has to be recorded at the moment the address arrives, not
  -- reconstructed later: enquiry | newsletter_optin | existing_customer | imported_customer
  consent_basis TEXT NOT NULL,
  consent_at    INTEGER NOT NULL,
  -- Free text for the evidence itself: the page, the subject line, or the file a list was
  -- imported from. This is what gets shown if anyone ever asks why they were written to.
  consent_note  TEXT,
  -- active | unsubscribed | bounced | complained. Only 'active' is ever sent to.
  status        TEXT NOT NULL DEFAULT 'active',
  status_at     INTEGER,
  -- Comma-wrapped so a LIKE '%,partners,%' cannot match a tag that merely starts the same.
  tags          TEXT NOT NULL DEFAULT ',',
  -- List hygiene: the last time this address did something (delivered, opened, enquired).
  last_engaged_at INTEGER,
  -- A mailbox that is full or briefly unavailable is a soft bounce. A few in a row means the
  -- address is gone in practice, so they are counted and the address retires itself.
  soft_bounces  INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_status  ON contacts (status);
CREATE INDEX IF NOT EXISTS idx_contacts_source  ON contacts (source);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts (country);

-- The never-send list. Separate from contacts on purpose: an address that unsubscribes or
-- hard-bounces must stay refused even if it is later re-imported from a spreadsheet, and a
-- deleted contact must not quietly become sendable again.
CREATE TABLE IF NOT EXISTS suppression (
  email      TEXT PRIMARY KEY,
  -- unsubscribe | bounce_hard | bounce_soft_limit | complaint | manual
  reason     TEXT NOT NULL,
  detail     TEXT,
  created_at INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------------------
-- 2. The website's enquiry inbox. Every form on the site lands here first.
-- ---------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,              -- enquiry | application | newsletter
  name        TEXT,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  subject     TEXT,
  message     TEXT,
  reason      TEXT,                       -- the reason the visitor picked (sales, careers, ...)
  market      TEXT,                       -- the country/market the site routed on
  position    TEXT,                       -- the job applied for
  route_email TEXT,                       -- the office address the site routed it to
  lang        TEXT,
  status      TEXT NOT NULL DEFAULT 'new',-- new | read | archived
  -- The notification to the office is sent by the mailer, not by the website: one place holds
  -- the sending credentials. Storing the enquiry first and mailing after means a mail outage
  -- can never lose an enquiry, it only delays the notification.
  notified    INTEGER NOT NULL DEFAULT 0,
  notify_at   INTEGER,
  notify_error TEXT,
  notify_tries INTEGER NOT NULL DEFAULT 0,
  ip          TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enquiries_created  ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status   ON enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_notified ON enquiries (notified);

-- A CV or a cover letter. Kept beside its enquiry rather than in an inbox, because the point
-- of the dashboard is that nothing needed to answer an applicant lives somewhere else.
CREATE TABLE IF NOT EXISTS enquiry_files (
  id          TEXT PRIMARY KEY,
  enquiry_id  TEXT NOT NULL,
  field       TEXT NOT NULL,              -- cv | cover_letter
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  bytes       BLOB NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_enquiry_files_enq ON enquiry_files (enquiry_id);

-- Per-IP throttle for the public form endpoint. The forms are open to the internet, and this
-- is a free-tier database: a script left running overnight is the realistic threat, not a
-- targeted attack.
CREATE TABLE IF NOT EXISTS form_guard (
  ip           TEXT PRIMARY KEY,
  hits         INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

-- One row, 'last_change': the moment the content last changed in any way, INCLUDING a
-- deletion. Publish compares against this so "Everything is live" cannot be shown while a
-- deleted item is still on the public site.
CREATE TABLE IF NOT EXISTS site_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
