import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { slugify, type GalleryCategoryRow, type GalleryRow } from '../types.js';

export const galleryCategoriesRouter = Router();

const folderInput = z.object({
  name: z.string().min(2, 'Give the folder a name.'),
  slug: z.string().optional(),
  position: z.number().int().optional(),
});

const CATEGORY_SELECT = `
  SELECT c.*, (SELECT COUNT(*) FROM gallery g WHERE g.category_id = c.id) AS photo_count,
    cov.url AS cover_image_url
  FROM gallery_categories c LEFT JOIN gallery cov ON cov.id = c.cover_image_id`;

type JoinedCategory = GalleryCategoryRow & { photo_count: number; cover_image_url: string | null };

galleryCategoriesRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(`${CATEGORY_SELECT} ORDER BY c.position, c.name`)
    .all() as JoinedCategory[];
  res.json(rows);
});

galleryCategoriesRouter.post('/', requireAdmin, (req, res) => {
  const parsed = folderInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const { name, position = 0 } = parsed.data;
  const slug = slugify(parsed.data.slug || name);

  const exists = db.prepare('SELECT id FROM gallery_categories WHERE slug = ?').get(slug);
  if (exists) return res.status(409).json({ error: 'A folder already uses that name.' });

  const info = db
    .prepare('INSERT INTO gallery_categories (slug, name, position) VALUES (?, ?, ?)')
    .run(slug, name, position);
  res
    .status(201)
    .json(db.prepare('SELECT * FROM gallery_categories WHERE id = ?').get(info.lastInsertRowid));
});

galleryCategoriesRouter.put('/:id', requireAdmin, (req, res) => {
  const parsed = folderInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const current = db.prepare('SELECT * FROM gallery_categories WHERE id = ?').get(req.params.id) as
    | GalleryCategoryRow
    | undefined;
  if (!current) return res.status(404).json({ error: 'That folder no longer exists.' });

  const { name, position = current.position } = parsed.data;
  const slug = slugify(parsed.data.slug || name);

  db.prepare('UPDATE gallery_categories SET slug = ?, name = ?, position = ? WHERE id = ?').run(
    slug,
    name,
    position,
    current.id,
  );
  res.json(db.prepare('SELECT * FROM gallery_categories WHERE id = ?').get(current.id));
});

galleryCategoriesRouter.put('/:id/cover', requireAdmin, (req, res) => {
  const folder = db.prepare('SELECT * FROM gallery_categories WHERE id = ?').get(req.params.id) as
    | GalleryCategoryRow
    | undefined;
  if (!folder) return res.status(404).json({ error: 'That folder no longer exists.' });

  const parsed = z.object({ shot_id: z.coerce.number().int().positive() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const shot = db.prepare('SELECT * FROM gallery WHERE id = ?').get(parsed.data.shot_id) as
    | GalleryRow
    | undefined;
  if (!shot || shot.category_id !== folder.id) {
    return res.status(400).json({ error: 'That photo is not in this folder.' });
  }

  db.prepare('UPDATE gallery_categories SET cover_image_id = ? WHERE id = ?').run(shot.id, folder.id);
  const row = db.prepare(`${CATEGORY_SELECT} WHERE c.id = ?`).get(folder.id) as JoinedCategory;
  res.json(row);
});

galleryCategoriesRouter.delete('/:id', requireAdmin, (req, res) => {
  const count = db
    .prepare('SELECT COUNT(*) AS n FROM gallery WHERE category_id = ?')
    .get(req.params.id) as { n: number };
  if (count.n > 0) {
    return res
      .status(409)
      .json({ error: `Move or delete the ${count.n} photo(s) in this folder first.` });
  }
  db.prepare('DELETE FROM gallery_categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
