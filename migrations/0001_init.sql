CREATE TABLE visitors (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE predictions (
  visitor_id TEXT NOT NULL,
  show TEXT NOT NULL,
  season INTEGER NOT NULL,
  couple TEXT NOT NULL,
  episode INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('t', 's', 'i')),
  cota REAL NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_id, show, season, couple, episode)
);

CREATE INDEX predictions_by_show ON predictions (show, season, couple);

CREATE TABLE poll_votes (
  visitor_id TEXT NOT NULL,
  poll TEXT NOT NULL,
  option INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_id, poll)
);

CREATE TABLE odds_current (
  show TEXT NOT NULL,
  season INTEGER NOT NULL,
  couple TEXT NOT NULL,
  t REAL NOT NULL,
  s REAL NOT NULL,
  i REAL NOT NULL,
  votes INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (show, season, couple)
);

CREATE TABLE outcomes (
  show TEXT NOT NULL,
  season INTEGER NOT NULL,
  couple TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('t', 's', 'i')),
  recorded_at INTEGER NOT NULL,
  PRIMARY KEY (show, season, couple)
);
