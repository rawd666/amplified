import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { hydrateProduct, slugify, type ProductRow } from '../types.js';

export const productsRouter = Router();

const productInput = z.object({
  name: z.string().min(2, 'Give the product a name.'),
  slug: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.coerce.number().int().positive('Pick a category.'),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  description: z.string().optional(),
  specs: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

type Joined = ProductRow & { category_slug: string; category_name: string };

const SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p JOIN categories c ON c.id = p.category_id`;

/** GET /api/products?category=guitars&q=strat&featured=1 */
productsRouter.get('/', (req, res) => {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (req.query.category) {
    clauses.push('c.slug = ?');
    params.push(String(req.query.category));
  }
  if (req.query.q) {
    clauses.push('(p.name LIKE ? OR p.brand LIKE ?)');
    params.push(`%${req.query.q}%`, `%${req.query.q}%`);
  }
  if (req.query.featured === '1') clauses.push('p.featured = 1');

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`${SELECT}${where} ORDER BY p.featured DESC, p.created_at DESC`)
    .all(...params) as Joined[];
  res.json(rows.map(hydrateProduct));
});

productsRouter.get('/:slug', (req, res) => {
  const row = db.prepare(`${SELECT} WHERE p.slug = ?`).get(req.params.slug) as Joined | undefined;
  if (!row) return res.status(404).json({ error: 'We could not find that product.' });
  res.json(hydrateProduct(row));
});

productsRouter.post('/', requireAdmin, (req, res) => {
  const parsed = productInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);

  if (db.prepare('SELECT id FROM products WHERE slug = ?').get(slug)) {
    return res.status(409).json({ error: 'A product already uses that slug.' });
  }

  const info = db
    .prepare(
      `INSERT INTO products (slug, name, brand, category_id, price, stock, description, specs, images, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      d.name,
      d.brand ?? '',
      d.category_id,
      d.price,
      d.stock,
      d.description ?? '',
      JSON.stringify(d.specs ?? []),
      JSON.stringify(d.images ?? []),
      d.featured ? 1 : 0,
    );

  const row = db.prepare(`${SELECT} WHERE p.id = ?`).get(info.lastInsertRowid) as Joined;
  res.status(201).json(hydrateProduct(row));
});

productsRouter.put('/:id', requireAdmin, (req, res) => {
  const parsed = productInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const current = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as
    | ProductRow
    | undefined;
  if (!current) return res.status(404).json({ error: 'That product no longer exists.' });

  const d = parsed.data;
  const slug = slugify(d.slug || d.name);

  db.prepare(
    `UPDATE products SET slug = ?, name = ?, brand = ?, category_id = ?, price = ?, stock = ?,
     description = ?, specs = ?, images = ?, featured = ? WHERE id = ?`,
  ).run(
    slug,
    d.name,
    d.brand ?? '',
    d.category_id,
    d.price,
    d.stock,
    d.description ?? '',
    JSON.stringify(d.specs ?? []),
    JSON.stringify(d.images ?? []),
    d.featured ? 1 : 0,
    current.id,
  );

  const row = db.prepare(`${SELECT} WHERE p.id = ?`).get(current.id) as Joined;
  res.json(hydrateProduct(row));
});

productsRouter.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
