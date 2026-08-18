import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import type { ReviewRow } from '../types.js';

export const reviewsRouter = Router();

const reviewInput = z.object({
  product_id: z.coerce.number().int().positive().nullable().optional(),
  author: z.string().min(2, 'Tell us your name.'),
  rating: z.coerce.number().int().min(1, 'Pick a rating.').max(5),
  title: z.string().max(80).optional(),
  body: z.string().min(10, 'Write at least a sentence about the gear.'),
});

const SELECT = `
  SELECT r.*, p.name AS product_name, p.slug AS product_slug
  FROM reviews r LEFT JOIN products p ON p.id = r.product_id`;

/** Public list: approved only. Admin list (?all=1 with a token): all items. */
reviewsRouter.get('/', (req, res) => {
  const wantsAll = req.query.all === '1';
  if (wantsAll) {
    return requireAdmin(req, res, () => {
      res.json(db.prepare(`${SELECT} ORDER BY r.created_at DESC`).all());
    });
  }
  const params: unknown[] = [];
  let where = ' WHERE r.approved = 1';
  if (req.query.product) {
    where += ' AND p.slug = ?';
    params.push(String(req.query.product));
  }
  res.json(db.prepare(`${SELECT}${where} ORDER BY r.created_at DESC`).all(...params));
});

reviewsRouter.post('/', (req, res) => {
  const parsed = reviewInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const info = db
    .prepare(
      'INSERT INTO reviews (product_id, author, rating, title, body, approved) VALUES (?, ?, ?, ?, ?, 0)',
    )
    .run(d.product_id ?? null, d.author, d.rating, d.title ?? '', d.body);
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid) as ReviewRow;
  res.status(201).json(row);
});

reviewsRouter.patch('/:id', requireAdmin, (req, res) => {
  const approved = req.body?.approved ? 1 : 0;
  db.prepare('UPDATE reviews SET approved = ? WHERE id = ?').run(approved, req.params.id);
  res.json({ ok: true, approved: Boolean(approved) });
});

reviewsRouter.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
