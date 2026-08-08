import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin, signToken } from '../auth.js';

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

authRouter.post('/login', (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const admin = db
    .prepare('SELECT id, email, password, name FROM admins WHERE email = ?')
    .get(parsed.data.email.toLowerCase()) as
    | { id: number; email: string; password: string; name: string }
    | undefined;

  if (!admin || !bcrypt.compareSync(parsed.data.password, admin.password)) {
    return res.status(401).json({ error: 'That email and password do not match.' });
  }

  const claims = { id: admin.id, email: admin.email, name: admin.name };
  res.json({ token: signToken(claims), admin: claims });
});

authRouter.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

authRouter.post('/password', requireAdmin, (req, res) => {
  const schema = z.object({ current: z.string(), next: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const row = db.prepare('SELECT password FROM admins WHERE id = ?').get(req.admin!.id) as
    | { password: string }
    | undefined;
  if (!row || !bcrypt.compareSync(parsed.data.current, row.password)) {
    return res.status(401).json({ error: 'Current password is wrong.' });
  }
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(
    bcrypt.hashSync(parsed.data.next, 10),
    req.admin!.id,
  );
  res.json({ ok: true });
});
