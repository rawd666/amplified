import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './types.js';

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
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    blurb      TEXT NOT NULL DEFAULT '',
    position   INTEGER NOT NULL DEFAULT 0,
    parent_id  INTEGER REFERENCES categories(id) ON DELETE RESTRICT
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

  CREATE TABLE IF NOT EXISTS gallery_categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    slug      TEXT NOT NULL UNIQUE,
    name      TEXT NOT NULL,
    position  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    url          TEXT NOT NULL,
    caption      TEXT NOT NULL DEFAULT '',
    category_id  INTEGER REFERENCES gallery_categories(id) ON DELETE SET NULL,
    position     INTEGER NOT NULL DEFAULT 0
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

// The CREATE TABLE above only runs on a fresh database - existing ones need
// the new column added by hand.
const categoryCols = db.prepare('PRAGMA table_info(categories)').all() as { name: string }[];
if (!categoryCols.some((c) => c.name === 'parent_id')) {
  db.exec('ALTER TABLE categories ADD COLUMN parent_id INTEGER');
}

// Gallery photos used to carry a free-text `tag` - fold any existing values
// into real gallery_categories rows and point category_id at them instead.
const galleryCols = db.prepare('PRAGMA table_info(gallery)').all() as { name: string }[];
if (galleryCols.some((c) => c.name === 'tag') && !galleryCols.some((c) => c.name === 'category_id')) {
  db.exec('ALTER TABLE gallery ADD COLUMN category_id INTEGER');

  const tags = db
    .prepare("SELECT DISTINCT tag FROM gallery WHERE tag IS NOT NULL AND tag != ''")
    .all() as { tag: string }[];
  const insertFolder = db.prepare('INSERT OR IGNORE INTO gallery_categories (slug, name) VALUES (?, ?)');
  const findFolder = db.prepare('SELECT id FROM gallery_categories WHERE slug = ?');
  const backfill = db.prepare('UPDATE gallery SET category_id = ? WHERE tag = ?');

  for (const { tag } of tags) {
    const slug = slugify(tag);
    insertFolder.run(slug, tag);
    const folder = findFolder.get(slug) as { id: number };
    backfill.run(folder.id, tag);
  }

  db.exec('ALTER TABLE gallery DROP COLUMN tag');
}

// Gallery photos can now be panned/zoomed into a 3:2 crop, same as products.
if (!galleryCols.some((c) => c.name === 'crop')) {
  db.exec('ALTER TABLE gallery ADD COLUMN crop TEXT');
}

// Folders can have an admin-picked cover photo.
const galleryCategoryCols = db.prepare('PRAGMA table_info(gallery_categories)').all() as {
  name: string;
}[];
if (!galleryCategoryCols.some((c) => c.name === 'cover_image_id')) {
  db.exec('ALTER TABLE gallery_categories ADD COLUMN cover_image_id INTEGER');
}

// Every gallery photo must belong to a folder now - fold any orphaned
// (no category) rows into a catch-all "Uncategorized" folder.
const orphanCount = (
  db.prepare('SELECT COUNT(*) AS n FROM gallery WHERE category_id IS NULL').get() as { n: number }
).n;
if (orphanCount > 0) {
  db.prepare('INSERT OR IGNORE INTO gallery_categories (slug, name) VALUES (?, ?)').run(
    'uncategorized',
    'Uncategorized',
  );
  const folder = db
    .prepare('SELECT id FROM gallery_categories WHERE slug = ?')
    .get('uncategorized') as { id: number };
  db.prepare('UPDATE gallery SET category_id = ? WHERE category_id IS NULL').run(folder.id);
}

export function reference(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}${Date.now()
    .toString()
    .slice(-4)}`;
}
