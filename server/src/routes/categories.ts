import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { slugify, type CategoryRow } from '../types.js';

export const categoriesRouter = Router();

const categoryInput = z.object({
  name: z.string().min(2, 'Give the category a name.'),
  slug: z.string().optional(),
  blurb: z.string().max(240).optional(),
  position: z.number().int().optional(),
});

categoriesRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.position, c.name`,
    )
    .all() as (CategoryRow & { product_count: number })[];
  res.json(rows);
});

categoriesRouter.post('/', requireAdmin, (req, res) => {
  const parsed = categoryInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const { name, blurb = '', position = 0 } = parsed.data;
  const slug = slugify(parsed.data.slug || name);

  const exists = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (exists) return res.status(409).json({ error: 'A category already uses that slug.' });

  const info = db
    .prepare('INSERT INTO categories (slug, name, blurb, position) VALUES (?, ?, ?, ?)')
    .run(slug, name, blurb, position);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid));
});

categoriesRouter.put('/:id', requireAdmin, (req, res) => {
  const parsed = categoryInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as
    | CategoryRow
    | undefined;
  if (!current) return res.status(404).json({ error: 'That category no longer exists.' });

  const { name, blurb = current.blurb, position = current.position } = parsed.data;
  const slug = slugify(parsed.data.slug || name);

  db.prepare('UPDATE categories SET slug = ?, name = ?, blurb = ?, position = ? WHERE id = ?').run(
    slug,
    name,
    blurb,
    position,
    current.id,
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(current.id));
});

categoriesRouter.delete('/:id', requireAdmin, (req, res) => {
  const count = db
    .prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?')
    .get(req.params.id) as { n: number };
  if (count.n > 0) {
    return res
      .status(409)
      .json({ error: `Move or delete the ${count.n} product(s) in this category first.` });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
