import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { productsRouter } from './routes/products.js';
import { reviewsRouter } from './routes/reviews.js';
import { ordersRouter, bookingsRouter } from './routes/orders.js';
import { uploadsRouter, galleryRouter, uploadsDir } from './routes/uploads.js';
import { demosRouter } from './routes/demos.js';
import './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? true }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/demos', demosRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/uploads', uploadsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// In production the built client is served from the same origin.
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// Multer and thrown errors land here so the UI always gets a readable message.
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(400).json({ error: err.message || 'Something went wrong.' });
  },
);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
