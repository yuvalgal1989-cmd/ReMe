import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db/database';
import { User, NotificationSettings } from '../types';
import { testSmtpConnection } from '../services/notificationService';

const router = Router();
router.use(requireAuth);

router.get('/settings', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let settings = db
    .prepare('SELECT * FROM notification_settings WHERE user_id = ?')
    .get(user.id) as NotificationSettings | undefined;

  if (!settings) {
    db.prepare('INSERT INTO notification_settings (user_id) VALUES (?)').run(user.id);
    settings = db
      .prepare('SELECT * FROM notification_settings WHERE user_id = ?')
      .get(user.id) as NotificationSettings;
  }

  // Don't expose smtp_pass
  const { smtp_pass, ...safe } = settings as any;
  res.json({ ...safe, smtp_pass_set: !!smtp_pass });
});

router.put('/settings', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const {
    email_enabled, notify_email, browser_enabled,
    smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
  } = req.body;

  db.prepare(
    `INSERT INTO notification_settings
     (user_id, email_enabled, notify_email, browser_enabled, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       email_enabled = excluded.email_enabled,
       notify_email = excluded.notify_email,
       browser_enabled = excluded.browser_enabled,
       smtp_host = excluded.smtp_host,
       smtp_port = excluded.smtp_port,
       smtp_user = excluded.smtp_user,
       smtp_pass = CASE WHEN excluded.smtp_pass IS NOT NULL THEN excluded.smtp_pass ELSE smtp_pass END,
       smtp_from = excluded.smtp_from`
  ).run(
    user.id,
    email_enabled ? 1 : 0,
    notify_email ?? null,
    browser_enabled !== false ? 1 : 0,
    smtp_host ?? null,
    smtp_port ?? 587,
    smtp_user ?? null,
    smtp_pass ?? null,
    smtp_from ?? null
  );

  res.json({ success: true });
});

router.post('/test', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const settings = db
    .prepare('SELECT * FROM notification_settings WHERE user_id = ?')
    .get(user.id) as NotificationSettings | undefined;

  if (!settings) { res.status(400).json({ error: 'No settings configured' }); return; }

  const ok = await testSmtpConnection(settings);
  res.json({ success: ok });
});

export default router;
