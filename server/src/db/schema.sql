-- WaitWise Database Schema
-- Embedded SQLite Engine

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('hospital', 'clinic', 'salon', 'government', 'restaurant', 'service_center', 'bank')),
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  operating_hours TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'busy', 'almost_full', 'closed', 'paused')),
  max_capacity INTEGER DEFAULT 50,
  avg_service_time_mins INTEGER DEFAULT 15,
  image_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer', 'staff', 'admin')),
  phone TEXT,
  business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_duration_mins INTEGER NOT NULL DEFAULT 15,
  price REAL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  current_ticket_id TEXT
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  counter_id TEXT REFERENCES counters(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
  priority INTEGER DEFAULT 0,
  notes TEXT,
  estimated_wait_mins INTEGER DEFAULT 0,
  actual_wait_mins INTEGER,
  joined_at TEXT NOT NULL,
  called_at TEXT,
  served_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES queue_entries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('turn_approaching', 'turn_now', 'skipped', 'cancelled', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wait_time_stats (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL,
  hour_of_day INTEGER NOT NULL,
  avg_wait_mins REAL NOT NULL,
  avg_service_mins REAL NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_queue_business_status ON queue_entries(business_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_user ON queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_counters_business ON counters(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_stats_lookup ON wait_time_stats(business_id, day_of_week, hour_of_day);
