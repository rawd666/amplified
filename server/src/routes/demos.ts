import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import type { DemoRow } from '../types.js';

export const demosRouter = Router();

const productId = z.coerce.number().int().positive().nullable().optional();

const demoInput = z.object({
  url: z.string().min(1, 'Upload a video first.'),
  product_name: z.string().min(1, 'Name the gear in the clip.'),
  product_id: productId,
  description: z.string().optional(),
  position: z.coerce.number().int().optional(),
});

/** GET /api/demos - every clip. ?product=<slug> narrows it to the clips linked to
 *  that product, and only while it's in stock - a sold item shows no demos. */
demosRouter.get('/', (req, res) => {
  if (req.query.product) {
    const rows = db
      .prepare(
        `SELECT d.* FROM demos d JOIN products p ON p.id = d.product_id
         WHERE p.slug = ? AND p.stock > 0 ORDER BY d.position, d.id DESC`,
      )
      .all(String(req.query.product)) as DemoRow[];
    return res.json(rows);
  }
  res.json(db.prepare('SELECT * FROM demos ORDER BY position, id DESC').all() as DemoRow[]);
});

demosRouter.post('/', requireAdmin, (req, res) => {
  const parsed = demoInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const info = db
    .prepare(
      'INSERT INTO demos (url, product_name, product_id, description, position) VALUES (?, ?, ?, ?, ?)',
    )
    .run(d.url, d.product_name, d.product_id ?? null, d.description ?? '', d.position ?? 0);
  res.status(201).json(db.prepare('SELECT * FROM demos WHERE id = ?').get(info.lastInsertRowid));
});

/** PATCH /api/demos/:id { product_id } - link a clip to a product (or null to unlink). */
demosRouter.patch('/:id', requireAdmin, (req, res) => {
  const parsed = productId.safeParse(req.body?.product_id);
  if (!parsed.success) return res.status(400).json({ error: 'Pick a valid product.' });
  db.prepare('UPDATE demos SET product_id = ? WHERE id = ?').run(parsed.data ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM demos WHERE id = ?').get(req.params.id));
});

demosRouter.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM demos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
