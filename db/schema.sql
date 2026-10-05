CREATE TABLE IF NOT EXISTS save (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  kingdom_name TEXT NOT NULL DEFAULT 'Kerajaan Baru',
  era INTEGER NOT NULL DEFAULT 1,
  population REAL NOT NULL DEFAULT 10,
  happiness REAL NOT NULL DEFAULT 100,
  tax_percent INTEGER NOT NULL DEFAULT 20,
  score INTEGER NOT NULL DEFAULT 0,
  last_resolved_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  -- Kesiapan multiplayer: kolom owner ditambahkan lewat migrasi saat auth datang.
  -- Semua API sudah menerima kingdomId.
);

CREATE TABLE IF NOT EXISTS resources (
  kingdom_id INTEGER NOT NULL,
  resource TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (kingdom_id, resource)
);

CREATE TABLE IF NOT EXISTS buildings (
  kingdom_id INTEGER NOT NULL,
  building_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  workers INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kingdom_id, building_id)
);

CREATE TABLE IF NOT EXISTS construction_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kingdom_id INTEGER NOT NULL,
  building_id TEXT NOT NULL,
  target_level INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  finishes_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kingdom_id INTEGER NOT NULL,
  tech_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finishes_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS techs (
  kingdom_id INTEGER NOT NULL,
  tech_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (kingdom_id, tech_id)
);

CREATE TABLE IF NOT EXISTS training_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kingdom_id INTEGER NOT NULL,
  unit_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  finishes_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
  kingdom_id INTEGER NOT NULL,
  unit_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kingdom_id, unit_id)
);

-- Armada yang sedang berangkat (serang/intai): pulang-pergi
CREATE TABLE IF NOT EXISTS marches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kingdom_id INTEGER NOT NULL,
  target_npc TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('scout','attack')),
  units_json TEXT NOT NULL,
  departed_at TEXT NOT NULL,
  arrives_at TEXT NOT NULL,
  returns_at TEXT,
  resolved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS npc_kingdoms (
  kingdom_id INTEGER NOT NULL,          -- id kerajaan pemain (semua milik 1 dulu)
  npc_name TEXT NOT NULL,
  power INTEGER NOT NULL,
  troops INTEGER NOT NULL DEFAULT 0,    -- kekuatan pasukan tersisa
  last_raided_at TEXT,
  PRIMARY KEY (kingdom_id, npc_name)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kingdom_id INTEGER NOT NULL,
  kind TEXT NOT NULL,                   -- construction | war | event | system
  title TEXT NOT NULL,
  body TEXT NOT NULL,                   -- teks kronik naratif
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  is_read INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS market_prices (
  kingdom_id INTEGER NOT NULL,
  resource TEXT NOT NULL,
  price REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (kingdom_id, resource)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kingdom_id INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  choices_json TEXT,
  resolved_choice TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved INTEGER NOT NULL DEFAULT 0
);
