const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'yyclaw.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  balance REAL DEFAULT 0,
  api_key TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  upstream_url TEXT DEFAULT '',
  upstream_key TEXT DEFAULT '',
  upstream_model TEXT DEFAULT '',
  price_per_call REAL NOT NULL,
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  model TEXT,
  cost REAL,
  status TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS used_tx_hashes (
  hash TEXT PRIMARY KEY,
  chain TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS nonces (
  address TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
`);

// Seed models if empty
const count = db.prepare('SELECT COUNT(*) as c FROM models').get();
if (count.c === 0) {
  const insert = db.prepare(`INSERT OR IGNORE INTO models (name, price_per_call) VALUES (?, ?)`);
  const models = [
    ['claude-haiku-4.5-fixed', 0.064],
    ['claude-haiku-4.5-thinking-fixed', 0.064],
    ['claude-opus-4-6-thinking-fixed', 0.160],
    ['claude-opus-4.6-fixed', 0.160],
    ['claude-sonnet-4-6-fixed', 0.100],
    ['claude-sonnet-4-fixed', 0.100],
    ['claude-sonnet-4-thinking-fixed', 0.100],
    ['claude-sonnet-4.5-fixed', 0.100],
    ['claude-sonnet-4.5-thinking-fixed', 0.100],
    ['gemini-2.5-flash-fixed', 0.010],
    ['gemini-2.5-pro-fixed', 0.060],
    ['gemini-3-flash-agent-fixed', 0.020],
    ['gemini-3-flash-fixed', 0.020],
    ['gemini-3-flash-preview-fixed', 0.030],
    ['gemini-3-pro-preview-fixed', 0.080],
    ['gemini-3-pro-preview-thinking-128-fixed', 0.080],
    ['gemini-3-pro-preview-thinking-512-fixed', 0.080],
    ['gemini-3-pro-preview-thinking-fixed', 0.080],
    ['gemini-3.1-flash-image-fixed', 0.200],
    ['gemini-3.1-pro-high-fixed', 0.060],
  ];
  for (const [name, price] of models) insert.run(name, price);
}

module.exports = db;
