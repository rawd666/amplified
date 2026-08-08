import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import type { GalleryRow } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error('Upload a JPG, PNG, WEBP or AVIF image.'));
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

/** Returns the public URLs the admin can paste into a product or the gallery. */
uploadsRouter.post('/', requireAdmin, upload.array('images', 8), (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) return res.status(400).json({ error: 'Choose at least one image.' });
  res.status(201).json({ urls: files.map((f) => `/uploads/${f.filename}`) });
});

uploadsRouter.delete('/', requireAdmin, (req, res) => {
  const url = String(req.query.url ?? '');
  const name = path.basename(url);
  const target = path.join(uploadsDir, name);
  if (target.startsWith(uploadsDir) && fs.existsSync(target)) fs.unlinkSync(target);
  res.json({ ok: true });
});

/* ---------- gallery ---------- */

export const galleryRouter = Router();

const galleryInput = z.object({
  url: z.string().min(1, 'Upload or paste an image first.'),
  caption: z.string().optional(),
  tag: z.string().optional(),
  position: z.coerce.number().int().optional(),
});

galleryRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM gallery ORDER BY position, id DESC').all() as GalleryRow[]);
});

galleryRouter.post('/', requireAdmin, (req, res) => {
  const parsed = galleryInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO gallery (url, caption, tag, position) VALUES (?, ?, ?, ?)')
    .run(d.url, d.caption ?? '', d.tag ?? 'shop', d.position ?? 0);
  res.status(201).json(db.prepare('SELECT * FROM gallery WHERE id = ?').get(info.lastInsertRowid));
});

galleryRouter.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
