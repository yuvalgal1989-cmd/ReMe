import { db } from '../db/database';
import { Reminder, ReminderWithContact, ActionType } from '../types';

export function getRemindersByUser(
  userId: number,
  opts: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
    from?: number;
    to?: number;
  } = {}
): ReminderWithContact[] {
  const conditions: string[] = ['r.user_id = ?'];
  const params: (number | string)[] = [userId];

  if (opts.status) { conditions.push('r.status = ?'); params.push(opts.status); }
  if (opts.category) { conditions.push('r.category = ?'); params.push(opts.category); }
  if (opts.from) { conditions.push('r.due_at >= ?'); params.push(opts.from); }
  if (opts.to) { conditions.push('r.due_at <= ?'); params.push(opts.to); }

  const where = conditions.join(' AND ');
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const rows = db
    .prepare(
      `SELECT r.*, c.name as contact_name, c.phone as contact_phone, c.email as contact_email
       FROM reminders r
       LEFT JOIN contacts c ON r.contact_id = c.id
       WHERE ${where}
       ORDER BY r.due_at ASC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as any[];

  return rows.map(mapRow);
}

export function getUpcomingReminders(userId: number, withinSeconds: number): ReminderWithContact[] {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now + withinSeconds;

  const rows = db
    .prepare(
      `SELECT r.*, c.name as contact_name, c.phone as contact_phone, c.email as contact_email
       FROM reminders r
       LEFT JOIN contacts c ON r.contact_id = c.id
       WHERE r.user_id = ? AND r.status = 'active' AND r.due_at <= ?
       ORDER BY r.due_at ASC`
    )
    .all(userId, cutoff) as any[];

  return rows.map(mapRow);
}

export function getReminderById(id: number, userId: number): ReminderWithContact | null {
  const row = db
    .prepare(
      `SELECT r.*, c.name as contact_name, c.phone as contact_phone, c.email as contact_email
       FROM reminders r
       LEFT JOIN contacts c ON r.contact_id = c.id
       WHERE r.id = ? AND r.user_id = ?`
    )
    .get(id, userId) as any;

  return row ? mapRow(row) : null;
}

export function createReminder(
  userId: number,
  data: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'snoozed_until'>
): Reminder {
  const now = Math.floor(Date.now() / 1000);
  const result = db
    .prepare(
      `INSERT INTO reminders
       (user_id, contact_id, title, description, category, due_at, remind_before_minutes,
        rrule, action_phone, action_email, action_whatsapp_msg, gcal_event_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      data.contact_id ?? null,
      data.title,
      data.description ?? null,
      data.category,
      data.due_at,
      data.remind_before_minutes,
      data.rrule ?? null,
      data.action_phone ?? null,
      data.action_email ?? null,
      data.action_whatsapp_msg ?? null,
      data.gcal_event_id ?? null,
      now,
      now
    );

  return getReminderById(result.lastInsertRowid as number, userId)! as Reminder;
}

export function updateReminder(
  id: number,
  userId: number,
  data: Partial<Omit<Reminder, 'id' | 'user_id' | 'created_at'>>
): Reminder | null {
  const now = Math.floor(Date.now() / 1000);
  const fields = Object.keys(data)
    .filter((k) => k !== 'updated_at')
    .map((k) => `${k} = ?`);
  const values = Object.values(data);

  if (fields.length === 0) return getReminderById(id, userId) as Reminder;

  db.prepare(
    `UPDATE reminders SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?`
  ).run(...values, now, id, userId);

  return getReminderById(id, userId) as Reminder;
}

export function deleteReminder(id: number, userId: number): boolean {
  const result = db
    .prepare(`UPDATE reminders SET status = 'archived', updated_at = ? WHERE id = ? AND user_id = ?`)
    .run(Math.floor(Date.now() / 1000), id, userId);
  return result.changes > 0;
}

export function snoozeReminder(
  id: number,
  userId: number,
  until: number,
  reason?: string
): Reminder | null {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `UPDATE reminders SET status = 'snoozed', snoozed_until = ?, updated_at = ? WHERE id = ? AND user_id = ?`
  ).run(until, now, id, userId);

  logAction(id, userId, 'snoozed', { snoozed_to: until, reason });
  return getReminderById(id, userId) as Reminder;
}

export function completeReminder(id: number, userId: number): Reminder | null {
  const reminder = getReminderById(id, userId);
  if (!reminder) return null;

  const now = Math.floor(Date.now() / 1000);

  if (reminder.rrule) {
    // Compute next occurrence
    const { RRule } = require('rrule');
    const rule = RRule.fromString(reminder.rrule);
    const nextDate = rule.after(new Date(reminder.due_at * 1000));
    if (nextDate) {
      const nextTs = Math.floor(nextDate.getTime() / 1000);
      db.prepare(
        `UPDATE reminders SET due_at = ?, status = 'active', snoozed_until = NULL, updated_at = ? WHERE id = ? AND user_id = ?`
      ).run(nextTs, now, id, userId);
    } else {
      db.prepare(
        `UPDATE reminders SET status = 'completed', updated_at = ? WHERE id = ? AND user_id = ?`
      ).run(now, id, userId);
    }
  } else {
    db.prepare(
      `UPDATE reminders SET status = 'completed', updated_at = ? WHERE id = ? AND user_id = ?`
    ).run(now, id, userId);
  }

  logAction(id, userId, 'completed', {});
  return getReminderById(id, userId) as Reminder;
}

export function logAction(
  reminderId: number,
  userId: number,
  actionType: ActionType,
  metadata: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO action_log (reminder_id, user_id, action_type, metadata, performed_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(reminderId, userId, actionType, JSON.stringify(metadata), Math.floor(Date.now() / 1000));
}

export function getActionHistory(reminderId: number, limit = 20) {
  return db
    .prepare(
      `SELECT * FROM action_log WHERE reminder_id = ? ORDER BY performed_at DESC LIMIT ?`
    )
    .all(reminderId, limit);
}

function mapRow(row: any): ReminderWithContact {
  const { contact_name, contact_phone, contact_email, ...reminder } = row;
  if (contact_name) {
    (reminder as ReminderWithContact).contact = {
      id: reminder.contact_id,
      user_id: reminder.user_id,
      name: contact_name,
      phone: contact_phone,
      email: contact_email,
      notes: null,
      created_at: 0,
    };
  }
  return reminder as ReminderWithContact;
}
