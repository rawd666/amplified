import { Router } from 'express';
import { z } from 'zod';
import { db, reference } from '../db.js';
import { requireAdmin } from '../auth.js';
import { safeParse } from '../types.js';

/* ---------- orders: cash on delivery only ---------- */

export const ordersRouter = Router();

const orderInput = z.object({
  customer: z.string().min(2, 'Enter your full name.'),
  phone: z.string().min(7, 'Enter a phone number we can call.'),
  email: z.string().email().or(z.literal('')).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  fulfilment: z.enum(['delivery', 'pickup']).default('delivery'),
  slot_date: z.string().optional(),
  slot_time: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.number().int(),
        name: z.string(),
        price: z.number(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1, 'Your cart is empty.'),
});

ordersRouter.post('/', (req, res) => {
  const parsed = orderInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;

  if (d.fulfilment === 'delivery' && !d.address?.trim()) {
    return res.status(400).json({ error: 'Add the address the courier should deliver to.' });
  }
  if (d.fulfilment === 'pickup' && (!d.slot_date || !d.slot_time)) {
    return res.status(400).json({ error: 'Pick the day and time you will collect the order.' });
  }

  const total = d.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const ref = reference('FL');

  db.prepare(
    `INSERT INTO orders (reference, customer, phone, email, address, city, notes, items, total, fulfilment, slot_date, slot_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    ref,
    d.customer,
    d.phone,
    d.email ?? '',
    d.address ?? '',
    d.city ?? '',
    d.notes ?? '',
    JSON.stringify(d.items),
    total,
    d.fulfilment,
    d.slot_date ?? '',
    d.slot_time ?? '',
  );

  res.status(201).json({ reference: ref, total, payment: 'cash-on-delivery' });
});

ordersRouter.get('/', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as {
    items: string;
  }[];
  res.json(rows.map((r) => ({ ...r, items: safeParse(r.items, []) })));
});

ordersRouter.patch('/:id', requireAdmin, (req, res) => {
  const status = z
    .enum(['new', 'confirmed', 'out-for-delivery', 'paid', 'cancelled'])
    .safeParse(req.body?.status);
  if (!status.success) return res.status(400).json({ error: 'Unknown status.' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status.data, req.params.id);
  res.json({ ok: true });
});

/* ---------- bookings: try before you buy, in store ---------- */

export const bookingsRouter = Router();

const bookingInput = z.object({
  customer: z.string().min(2, 'Enter your full name.'),
  phone: z.string().min(7, 'Enter a phone number we can call.'),
  reason: z.enum(['try-out', 'setup', 'repair', 'lesson']).default('try-out'),
  interest: z.string().optional(),
  slot_date: z.string().min(4, 'Pick a day.'),
  slot_time: z.string().min(3, 'Pick a time.'),
  notes: z.string().optional(),
});

bookingsRouter.post('/', (req, res) => {
  const parsed = bookingInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;

  const taken = db
    .prepare("SELECT id FROM bookings WHERE slot_date = ? AND slot_time = ? AND status != 'cancelled'")
    .get(d.slot_date, d.slot_time);
  if (taken) return res.status(409).json({ error: 'That slot is taken. Choose another time.' });

  const ref = reference('BK');
  db.prepare(
    `INSERT INTO bookings (reference, customer, phone, reason, interest, slot_date, slot_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(ref, d.customer, d.phone, d.reason, d.interest ?? '', d.slot_date, d.slot_time, d.notes ?? '');

  res.status(201).json({ reference: ref });
});

/** Public: which slots are already gone on a given day. */
bookingsRouter.get('/taken', (req, res) => {
  const rows = db
    .prepare("SELECT slot_time FROM bookings WHERE slot_date = ? AND status != 'cancelled'")
    .all(String(req.query.date ?? '')) as { slot_time: string }[];
  res.json(rows.map((r) => r.slot_time));
});

bookingsRouter.get('/', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM bookings ORDER BY slot_date, slot_time').all());
});

bookingsRouter.patch('/:id', requireAdmin, (req, res) => {
  const status = z.enum(['pending', 'confirmed', 'done', 'cancelled']).safeParse(req.body?.status);
  if (!status.success) return res.status(400).json({ error: 'Unknown status.' });
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status.data, req.params.id);
  res.json({ ok: true });
});
