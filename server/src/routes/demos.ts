import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import type { DemoRow } from '../types.js';

export const demosRouter = Router();

const demoInput = z.object({
  url: z.string().min(1, 'Upload a video first.'),
  product_name: z.string().min(1, 'Name the gear in the clip.'),
  description: z.string().optional(),
  position: z.coerce.number().int().optional(),
});

demosRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM demos ORDER BY position, id DESC').all() as DemoRow[]);
});

demosRouter.post('/', requireAdmin, (req, res) => {
  const parsed = demoInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO demos (url, product_name, description, position) VALUES (?, ?, ?, ?)')
    .run(d.url, d.product_name, d.description ?? '', d.position ?? 0);
  res.status(201).json(db.prepare('SELECT * FROM demos WHERE id = ?').get(info.lastInsertRowid));
});

demosRouter.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM demos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
