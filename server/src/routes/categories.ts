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
  parent_id: z.coerce.number().int().positive().nullable().optional(),
});

/** Categories are capped at two levels - reject anything that would nest a
 *  subcategory under another subcategory, or turn a parent into a child. */
function validateParent(parentId: number | null | undefined, currentId?: number) {
  if (!parentId) return null;
  if (parentId === currentId) return 'A category cannot be its own parent.';

  const parent = db.prepare('SELECT * FROM categories WHERE id = ?').get(parentId) as
    | CategoryRow
    | undefined;
  if (!parent) return 'That parent category does not exist.';
  if (parent.parent_id) return 'Subcategories can only be one level deep.';

  if (currentId) {
    const hasChildren = db
      .prepare('SELECT COUNT(*) AS n FROM categories WHERE parent_id = ?')
      .get(currentId) as { n: number };
    if (hasChildren.n > 0) return 'This category already has its own subcategories.';
  }
  return null;
}

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

  const { name, blurb = '', position = 0, parent_id = null } = parsed.data;
  const slug = slugify(parsed.data.slug || name);

  const exists = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (exists) return res.status(409).json({ error: 'A category already uses that slug.' });

  const parentError = validateParent(parent_id);
  if (parentError) return res.status(400).json({ error: parentError });

  const info = db
    .prepare('INSERT INTO categories (slug, name, blurb, position, parent_id) VALUES (?, ?, ?, ?, ?)')
    .run(slug, name, blurb, position, parent_id);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid));
});

categoriesRouter.put('/:id', requireAdmin, (req, res) => {
  const parsed = categoryInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as
    | CategoryRow
    | undefined;
  if (!current) return res.status(404).json({ error: 'That category no longer exists.' });

  const {
    name,
    blurb = current.blurb,
    position = current.position,
    parent_id = current.parent_id,
  } = parsed.data;
  const slug = slugify(parsed.data.slug || name);

  const parentError = validateParent(parent_id, current.id);
  if (parentError) return res.status(400).json({ error: parentError });

  db.prepare(
    'UPDATE categories SET slug = ?, name = ?, blurb = ?, position = ?, parent_id = ? WHERE id = ?',
  ).run(slug, name, blurb, position, parent_id, current.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(current.id));
});

categoriesRouter.delete('/:id', requireAdmin, (req, res) => {
  const children = db
    .prepare('SELECT COUNT(*) AS n FROM categories WHERE parent_id = ?')
    .get(req.params.id) as { n: number };
  if (children.n > 0) {
    return res
      .status(409)
      .json({ error: `Delete or move its ${children.n} subcategor${children.n === 1 ? 'y' : 'ies'} first.` });
  }

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
