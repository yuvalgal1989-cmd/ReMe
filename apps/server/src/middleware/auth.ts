import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { User } from '../types';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'User not found' });
    return;
  }

  (req as any).user = user;
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
    if (user) (req as any).user = user;
  }
  next();
}
