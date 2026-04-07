import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { config } from '../config';
import { getAuthUrl, exchangeCodeForTokens, getUserInfo } from '../services/googleCalendarService';
import { requireAuth } from '../middleware/auth';
import { User } from '../types';

const router = Router();

// GET /api/auth/google
router.get('/google', (req: Request, res: Response) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    res.status(503).json({ error: 'Google OAuth not configured' });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  res.redirect(getAuthUrl(state));
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code) {
    res.redirect(`${config.clientOrigin}/login?auth_error=${error || 'no_code'}`);
    return;
  }

  if (state !== req.session.oauthState) {
    res.redirect(`${config.clientOrigin}/login?auth_error=state_mismatch`);
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.access_token!);

    if (!userInfo.email) throw new Error('No email in Google response');

    const now = Math.floor(Date.now() / 1000);
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(userInfo.email) as User | undefined;

    let userId: number;
    if (existing) {
      db.prepare(
        `UPDATE users SET name = ?, google_access_token = ?, google_refresh_token = ?,
         google_token_expiry = ?, updated_at = ? WHERE id = ?`
      ).run(
        userInfo.name || existing.name,
        tokens.access_token,
        tokens.refresh_token || existing.google_refresh_token,
        tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        now,
        existing.id
      );
      userId = existing.id;
    } else {
      const result = db
        .prepare(
          `INSERT INTO users (email, name, google_access_token, google_refresh_token, google_token_expiry)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          userInfo.email,
          userInfo.name || null,
          tokens.access_token,
          tokens.refresh_token || null,
          tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null
        );
      userId = result.lastInsertRowid as number;

      // Create default notification settings
      db.prepare('INSERT OR IGNORE INTO notification_settings (user_id) VALUES (?)').run(userId);
    }

    req.session.userId = userId;
    delete req.session.oauthState;
    res.redirect(`${config.clientOrigin}/auth-success?auth_success=1`);
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.redirect(`${config.clientOrigin}/login?auth_error=callback_failed`);
  }
});

// Manual login (for dev without Google OAuth)
router.post('/dev-login', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) { res.status(400).json({ error: 'email required' }); return; }

  const now = Math.floor(Date.now() / 1000);
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

  if (!user) {
    const result = db.prepare('INSERT INTO users (email, name) VALUES (?, ?)').run(email, name || null);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
    db.prepare('INSERT OR IGNORE INTO notification_settings (user_id) VALUES (?)').run(user.id);
  }

  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const userId = req.session?.userId;
  if (!userId) { res.json({ user: null }); return; }

  const user = db.prepare('SELECT id, email, name, google_access_token, google_calendar_id FROM users WHERE id = ?').get(userId) as any;
  if (!user) { res.json({ user: null }); return; }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      googleConnected: !!user.google_access_token,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

export default router;
