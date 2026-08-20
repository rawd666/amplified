import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { safeParse, type GalleryRow, type ImageCrop } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error('Upload a JPG, PNG, WEBP or AVIF image.'));
    }
    cb(null, true);
  },
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO.includes(file.mimetype)) {
      return cb(new Error('Upload an MP4, WebM, MOV or OGG video.'));
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

/** A clip is one file, so this returns a single URL rather than an array. */
uploadsRouter.post('/video', requireAdmin, uploadVideo.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a video file.' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
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

const cropSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const galleryInput = z.object({
  url: z.string().min(1, 'Upload or paste an image first.'),
  caption: z.string().optional(),
  category_id: z.coerce.number().int().positive('Choose a folder.'),
  position: z.coerce.number().int().optional(),
  crop: cropSchema.optional(),
});

const GALLERY_SELECT = `
  SELECT g.*, gc.slug AS category_slug, gc.name AS category_name
  FROM gallery g LEFT JOIN gallery_categories gc ON gc.id = g.category_id`;

type JoinedGallery = GalleryRow & { category_slug: string | null; category_name: string | null };

/** The stored crop is JSON text (or null) - hand back a real object to clients. */
function withCrop<T extends { crop: string | null }>(row: T) {
  return { ...row, crop: row.crop ? safeParse<ImageCrop | null>(row.crop, null) : null };
}

galleryRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(`${GALLERY_SELECT} ORDER BY g.position, g.id DESC`)
    .all() as JoinedGallery[];
  res.json(rows.map(withCrop));
});

galleryRouter.post('/', requireAdmin, (req, res) => {
  const parsed = galleryInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO gallery (url, caption, category_id, position, crop) VALUES (?, ?, ?, ?, ?)')
    .run(d.url, d.caption ?? '', d.category_id, d.position ?? 0, d.crop ? JSON.stringify(d.crop) : null);
  const row = db.prepare(`${GALLERY_SELECT} WHERE g.id = ?`).get(info.lastInsertRowid) as JoinedGallery;
  res.status(201).json(withCrop(row));
});

galleryRouter.put('/:id', requireAdmin, (req, res) => {
  const current = db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id) as
    | GalleryRow
    | undefined;
  if (!current) return res.status(404).json({ error: 'That photo no longer exists.' });

  const patch = z
    .object({
      caption: z.string().optional(),
      category_id: z.coerce.number().int().positive().optional(),
      url: z.string().optional(),
      crop: cropSchema.optional(),
    })
    .safeParse(req.body);
  if (!patch.success) return res.status(400).json({ error: patch.error.issues[0].message });

  const { caption = current.caption, category_id = current.category_id, url = current.url } =
    patch.data;
  const crop = patch.data.crop !== undefined ? JSON.stringify(patch.data.crop) : current.crop;

  if (category_id !== current.category_id) {
    db.prepare('UPDATE gallery_categories SET cover_image_id = NULL WHERE cover_image_id = ?').run(
      current.id,
    );
  }

  db.prepare('UPDATE gallery SET caption = ?, category_id = ?, url = ?, crop = ? WHERE id = ?').run(
    caption,
    category_id,
    url,
    crop,
    current.id,
  );
  const row = db.prepare(`${GALLERY_SELECT} WHERE g.id = ?`).get(current.id) as JoinedGallery;
  res.json(withCrop(row));
});

galleryRouter.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE gallery_categories SET cover_image_id = NULL WHERE cover_image_id = ?').run(
    req.params.id,
  );
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
