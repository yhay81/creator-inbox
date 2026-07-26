PRAGMA foreign_keys = ON;

CREATE TABLE user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX user_email_unique ON user (email);

CREATE TABLE session (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX session_token_unique ON session (token);
CREATE INDEX session_user_id_idx ON session (user_id);

CREATE TABLE account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX account_user_id_idx ON account (user_id);
CREATE UNIQUE INDEX account_provider_account_unique ON account (provider_id, account_id);

CREATE TABLE verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX verification_identifier_idx ON verification (identifier);

CREATE TABLE inboxes (
  id TEXT PRIMARY KEY NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (
    length(slug) BETWEEN 3 AND 32
    AND slug NOT GLOB '*[^a-z0-9-]*'
  ),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 50),
  intro TEXT NOT NULL DEFAULT '' CHECK (length(intro) <= 300),
  muted_words TEXT NOT NULL DEFAULT '' CHECK (length(muted_words) <= 500),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX inboxes_slug_unique ON inboxes (slug);
CREATE UNIQUE INDEX inboxes_owner_user_unique ON inboxes (owner_user_id);

CREATE TABLE messages (
  id TEXT PRIMARY KEY NOT NULL,
  inbox_id TEXT NOT NULL REFERENCES inboxes (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('emoji', 'feedback', 'prompt', 'question')),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX messages_inbox_created_idx ON messages (inbox_id, created_at);
CREATE INDEX messages_inbox_status_idx ON messages (inbox_id, status);

CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  inbox_id TEXT REFERENCES inboxes (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (
    name IN ('inbox_created', 'message_received', 'message_opened', 'message_archived')
  ),
  occurred_on TEXT NOT NULL CHECK (length(occurred_on) = 10),
  created_at INTEGER NOT NULL
);
CREATE INDEX events_name_day_idx ON events (name, occurred_on);
CREATE INDEX events_inbox_day_idx ON events (inbox_id, occurred_on);
