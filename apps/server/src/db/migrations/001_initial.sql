CREATE TABLE IF NOT EXISTS schema_versions (
  version   INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS users (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  email                 TEXT UNIQUE NOT NULL,
  name                  TEXT,
  google_access_token   TEXT,
  google_refresh_token  TEXT,
  google_token_expiry   INTEGER,
  google_calendar_id    TEXT DEFAULT 'primary',
  created_at            INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at            INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  notes      TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);

CREATE TABLE IF NOT EXISTS reminders (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id             INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  title                  TEXT NOT NULL,
  description            TEXT,
  category               TEXT NOT NULL DEFAULT 'custom',
  due_at                 INTEGER NOT NULL,
  remind_before_minutes  INTEGER NOT NULL DEFAULT 60,
  rrule                  TEXT,
  status                 TEXT NOT NULL DEFAULT 'active',
  snoozed_until          INTEGER,
  action_phone           TEXT,
  action_email           TEXT,
  action_whatsapp_msg    TEXT,
  gcal_event_id          TEXT,
  created_at             INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at             INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_due ON reminders(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

CREATE TABLE IF NOT EXISTS notification_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_id   INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL,
  sent_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  success       INTEGER NOT NULL DEFAULT 1,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS action_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_id  INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type  TEXT NOT NULL,
  metadata     TEXT,
  performed_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS notification_settings (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_enabled  INTEGER NOT NULL DEFAULT 0,
  notify_email   TEXT,
  browser_enabled INTEGER NOT NULL DEFAULT 1,
  smtp_host      TEXT,
  smtp_port      INTEGER DEFAULT 587,
  smtp_user      TEXT,
  smtp_pass      TEXT,
  smtp_from      TEXT
);
