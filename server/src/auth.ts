import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export interface AdminClaims {
  id: number;
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminClaims;
    }
  }
}

export function signToken(admin: AdminClaims) {
  return jwt.sign(admin, SECRET, { expiresIn: '12h' });
}

/** Blocks anything that is not a signed-in admin. Used on every write route. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }
  try {
    req.admin = jwt.verify(token, SECRET) as AdminClaims;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}
