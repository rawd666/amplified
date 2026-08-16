import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'data.sqlite');

export const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    name      TEXT NOT NULL DEFAULT 'Admin'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    slug      TEXT NOT NULL UNIQUE,
    name      TEXT NOT NULL,
    blurb     TEXT NOT NULL DEFAULT '',
    position  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    brand        TEXT NOT NULL DEFAULT '',
    category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    price        REAL NOT NULL DEFAULT 0,
    stock        INTEGER NOT NULL DEFAULT 0,
    description  TEXT NOT NULL DEFAULT '',
    specs        TEXT NOT NULL DEFAULT '[]',
    images       TEXT NOT NULL DEFAULT '[]',
    featured     INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    url       TEXT NOT NULL,
    caption   TEXT NOT NULL DEFAULT '',
    tag       TEXT NOT NULL DEFAULT 'shop',
    position  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS demos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    url           TEXT NOT NULL,
    product_name  TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    position      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
    author      TEXT NOT NULL,
    rating      INTEGER NOT NULL,
    title       TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL,
    approved    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reference     TEXT NOT NULL UNIQUE,
    customer      TEXT NOT NULL,
    phone         TEXT NOT NULL,
    email         TEXT NOT NULL DEFAULT '',
    address       TEXT NOT NULL DEFAULT '',
    city          TEXT NOT NULL DEFAULT '',
    notes         TEXT NOT NULL DEFAULT '',
    items         TEXT NOT NULL DEFAULT '[]',
    total         REAL NOT NULL DEFAULT 0,
    fulfilment    TEXT NOT NULL DEFAULT 'delivery',
    slot_date     TEXT NOT NULL DEFAULT '',
    slot_time     TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'new',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    reference   TEXT NOT NULL UNIQUE,
    customer    TEXT NOT NULL,
    phone       TEXT NOT NULL,
    reason      TEXT NOT NULL DEFAULT 'try-out',
    interest    TEXT NOT NULL DEFAULT '',
    slot_date   TEXT NOT NULL,
    slot_time   TEXT NOT NULL,
    notes       TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function reference(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}${Date.now()
    .toString()
    .slice(-4)}`;
}
