PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agent TEXT NOT NULL,
  deps TEXT NOT NULL,          -- JSON array of ids
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | READY | RUNNING | DONE | FAILED
  payload TEXT,                -- JSON blob
  claimed_by TEXT,
  lease_until INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  task_id TEXT,
  data TEXT
);