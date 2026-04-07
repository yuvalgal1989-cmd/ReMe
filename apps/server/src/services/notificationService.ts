import nodemailer from 'nodemailer';
import { db } from '../db/database';
import { NotificationSettings } from '../types';

function getTransporter(settings: NotificationSettings) {
  return nodemailer.createTransport(
    {
      host: settings.smtp_host || 'smtp.gmail.com',
      port: settings.smtp_port || 587,
      secure: false,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
    } as any
  );
}

export async function sendReminderEmail(
  userId: number,
  reminderId: number,
  subject: string,
  body: string
): Promise<boolean> {
  const settings = db
    .prepare('SELECT * FROM notification_settings WHERE user_id = ?')
    .get(userId) as NotificationSettings | undefined;

  if (!settings || !settings.email_enabled || !settings.notify_email || !settings.smtp_user) {
    return false;
  }

  try {
    const transporter = getTransporter(settings);
    await transporter.sendMail({
      from: settings.smtp_from || settings.smtp_user,
      to: settings.notify_email,
      subject,
      html: body,
    });

    db.prepare(
      `INSERT INTO notification_log (reminder_id, channel, success) VALUES (?, 'email', 1)`
    ).run(reminderId);

    return true;
  } catch (err: any) {
    db.prepare(
      `INSERT INTO notification_log (reminder_id, channel, success, error_message) VALUES (?, 'email', 0, ?)`
    ).run(reminderId, err.message);
    return false;
  }
}

export async function testSmtpConnection(settings: NotificationSettings): Promise<boolean> {
  try {
    const transporter = getTransporter(settings);
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

export function wasRecentlyNotified(reminderId: number, withinSeconds = 3600): boolean {
  const cutoff = Math.floor(Date.now() / 1000) - withinSeconds;
  const row = db
    .prepare(
      `SELECT id FROM notification_log WHERE reminder_id = ? AND sent_at > ? AND success = 1 LIMIT 1`
    )
    .get(reminderId, cutoff);
  return !!row;
}
