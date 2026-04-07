import cron from 'node-cron';
import { db } from '../db/database';
import { sendReminderEmail, wasRecentlyNotified } from '../services/notificationService';
import { ReminderWithContact } from '../types';

export function startReminderCron() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const now = Math.floor(Date.now() / 1000);

    const reminders = db
      .prepare(
        `SELECT r.*, c.name as contact_name FROM reminders r
         LEFT JOIN contacts c ON r.contact_id = c.id
         WHERE r.status = 'active' AND r.due_at <= ? + (r.remind_before_minutes * 60)
         ORDER BY r.due_at ASC`
      )
      .all(now) as any[];

    for (const reminder of reminders) {
      if (wasRecentlyNotified(reminder.id)) continue;

      const dueDate = new Date(reminder.due_at * 1000);
      const contactPart = reminder.contact_name ? ` for ${reminder.contact_name}` : '';
      const subject = `Reminder: ${reminder.title}${contactPart}`;
      const body = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">⏰ ${reminder.title}</h2>
          ${reminder.description ? `<p>${reminder.description}</p>` : ''}
          <p><strong>Due:</strong> ${dueDate.toLocaleString()}</p>
          ${reminder.contact_name ? `<p><strong>Contact:</strong> ${reminder.contact_name}</p>` : ''}
          ${reminder.action_phone ? `<p><a href="tel:${reminder.action_phone}">📞 Call ${reminder.action_phone}</a></p>` : ''}
          ${reminder.action_phone ? `<p><a href="https://wa.me/${reminder.action_phone.replace(/\D/g, '')}">💬 WhatsApp ${reminder.action_phone}</a></p>` : ''}
          ${reminder.action_email ? `<p><a href="mailto:${reminder.action_email}">✉️ Email ${reminder.action_email}</a></p>` : ''}
          <hr style="margin-top: 20px;"/>
          <p style="color: #6B7280; font-size: 12px;">From ReMe</p>
        </div>
      `;

      await sendReminderEmail(reminder.user_id, reminder.id, subject, body);
    }
  });

  // Reactivate snoozed reminders
  cron.schedule('* * * * *', () => {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `UPDATE reminders SET status = 'active', snoozed_until = NULL, updated_at = ?
       WHERE status = 'snoozed' AND snoozed_until <= ?`
    ).run(now, now);
  });

  console.log('Reminder cron jobs started');
}
