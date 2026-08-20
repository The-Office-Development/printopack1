-- Printopack mailer: the campaign side of the same database.
--
-- Deliberately in the SAME D1 as `contacts`, which the website writes into. The mailer never
-- copies or imports the website's addresses, it reads the one table they were written to.
-- Everything here is prefixed mail_ so the two halves are readable apart at a glance.
--
--   wrangler d1 execute printopack --remote --file db/migrations/002_mailer.sql

-- Sending configuration and the operator's password, editable in the tool, so the client
-- never needs a developer to change a from-address or rotate a password.
CREATE TABLE IF NOT EXISTS mail_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- The mailer's own single account (the GM's assistant), separate from the website admin:
-- different people, different tools, and one leaving should not cost the other their access.
CREATE TABLE IF NOT EXISTS mail_auth (
  key        TEXT PRIMARY KEY,            -- 'pass_hash'
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS mail_login_guard (
  ip           TEXT PRIMARY KEY,
  fails        INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL
);

-- A reusable letter. The weekly send is normally "last week's template with new words in it",
-- so the template holds the frame and the campaign holds the words.
CREATE TABLE IF NOT EXISTS mail_templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  subject    TEXT,
  subject_ar TEXT,
  html       TEXT,
  html_ar    TEXT,
  updated_at INTEGER NOT NULL
);

-- One send to one audience.
CREATE TABLE IF NOT EXISTS mail_campaigns (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  subject_ar  TEXT,
  preheader   TEXT,
  html        TEXT NOT NULL,
  html_ar     TEXT,
  -- JSON: which contacts this goes to (status, source, country, tags, language).
  filter      TEXT NOT NULL DEFAULT '{}',
  -- draft | queued | sending | paused | done | cancelled
  --
  -- 'queued' is the moment the audience is frozen into mail_recipients. Everything after that
  -- reads from that list and never re-runs the filter, so a contact added mid-send cannot be
  -- picked up half way through and a removed one cannot shift the cursor.
  status      TEXT NOT NULL DEFAULT 'draft',
  total       INTEGER NOT NULL DEFAULT 0,
  sent        INTEGER NOT NULL DEFAULT 0,
  failed      INTEGER NOT NULL DEFAULT 0,
  bounced     INTEGER NOT NULL DEFAULT 0,
  complained  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  queued_at   INTEGER,
  started_at  INTEGER,
  finished_at INTEGER,
  -- Why a send stopped by itself, in plain words, for the person who comes back to it later.
  pause_reason TEXT,
  last_error  TEXT
);
CREATE INDEX IF NOT EXISTS idx_mail_campaigns_status ON mail_campaigns (status);

-- One row per recipient per campaign: the frozen audience AND the send log.
--
-- This table is what makes a send resumable. The id is campaign+contact, so re-queueing or a
-- retried write cannot create a second row, and a row only leaves 'pending' after SES has
-- accepted it. A worker that dies mid-chunk therefore resends nothing and skips nothing.
CREATE TABLE IF NOT EXISTS mail_recipients (
  id          TEXT PRIMARY KEY,           -- '<campaign_id>:<contact_id>'
  campaign_id TEXT NOT NULL,
  contact_id  TEXT NOT NULL,
  email       TEXT NOT NULL,
  name        TEXT,
  lang        TEXT NOT NULL DEFAULT 'en',
  -- pending | sent | failed | skipped   (skipped = suppressed between queueing and sending)
  state       TEXT NOT NULL DEFAULT 'pending',
  attempts    INTEGER NOT NULL DEFAULT 0,
  message_id  TEXT,
  error       TEXT,
  sent_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_mail_recipients_work ON mail_recipients (campaign_id, state);
CREATE INDEX IF NOT EXISTS idx_mail_recipients_msg  ON mail_recipients (message_id);

-- What Amazon told us afterwards: deliveries, bounces, complaints, and the unsubscribes the
-- tool records itself. The reputation figures on the dashboard are counted from here.
CREATE TABLE IF NOT EXISTS mail_events (
  id          TEXT PRIMARY KEY,
  at          INTEGER NOT NULL,
  type        TEXT NOT NULL,              -- delivery | bounce | complaint | unsubscribe | send | reject
  subtype     TEXT,                       -- Permanent | Transient | abuse | ...
  email       TEXT,
  campaign_id TEXT,
  message_id  TEXT,
  detail      TEXT
);
CREATE INDEX IF NOT EXISTS idx_mail_events_at    ON mail_events (at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_events_email ON mail_events (email);
CREATE INDEX IF NOT EXISTS idx_mail_events_camp  ON mail_events (campaign_id, type);
