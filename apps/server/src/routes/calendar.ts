import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { User } from '../types';
import * as gcal from '../services/googleCalendarService';
import * as reminderSvc from '../services/reminderService';

const router = Router();
router.use(requireAuth);

// GET /api/calendar/events
router.get('/events', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (!user.google_refresh_token) {
    res.status(400).json({ error: 'Google Calendar not connected' });
    return;
  }

  const from = req.query.from ? new Date(req.query.from as string) : new Date();
  const to = req.query.to ? new Date(req.query.to as string) : new Date(Date.now() + 30 * 86400 * 1000);

  try {
    const events = await gcal.listCalendarEvents(user.id, from, to);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calendar/free-slots
router.get('/free-slots', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (!user.google_refresh_token) {
    res.status(400).json({ error: 'Google Calendar not connected' });
    return;
  }

  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  const duration = parseInt((req.query.duration_minutes as string) || '30', 10);

  try {
    const slots = await gcal.findFreeSlots(user.id, date, duration);
    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calendar/imported-ids - return gcal event IDs already imported for this user
router.get('/imported-ids', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { db } = require('../db/database');
  const rows = db
    .prepare(`SELECT gcal_event_id FROM reminders WHERE user_id = ? AND gcal_event_id IS NOT NULL AND status != 'archived'`)
    .all(user.id) as { gcal_event_id: string }[];
  res.json({ ids: rows.map((r) => r.gcal_event_id) });
});

// POST /api/calendar/import - import GCal events as reminders (skips already imported)
router.post('/import', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (!user.google_refresh_token) {
    res.status(400).json({ error: 'Google Calendar not connected' });
    return;
  }

  const { event_ids } = req.body as { event_ids?: string[] };
  const from = new Date();
  const to = new Date(Date.now() + 90 * 86400 * 1000);

  try {
    const { db } = require('../db/database');
    // Get already-imported gcal event IDs
    const existingRows = db
      .prepare(`SELECT gcal_event_id FROM reminders WHERE user_id = ? AND gcal_event_id IS NOT NULL AND status != 'archived'`)
      .all(user.id) as { gcal_event_id: string }[];
    const existingIds = new Set(existingRows.map((r) => r.gcal_event_id));

    const events = await gcal.listCalendarEvents(user.id, from, to);
    const toImport = (event_ids
      ? events.filter((e) => event_ids.includes(e.id!))
      : events
    ).filter((e) => e.id && !existingIds.has(e.id)); // skip duplicates

    const imported: any[] = [];
    const skipped: string[] = [];

    for (const event of toImport) {
      if (!event.start?.dateTime && !event.start?.date) continue;
      const startStr = event.start.dateTime || event.start.date;
      if (!startStr) continue;
      const dueAt = Math.floor(new Date(startStr).getTime() / 1000);

      const reminder = reminderSvc.createReminder(user.id, {
        contact_id: null,
        title: event.summary || 'Google Calendar Event',
        description: event.description || null,
        category: 'meeting',
        due_at: dueAt,
        remind_before_minutes: 60,
        rrule: null,
        action_phone: null,
        action_email: null,
        action_whatsapp_msg: null,
        gcal_event_id: event.id || null,
      });
      imported.push(reminder);
    }

    // Count skipped (requested but already exist)
    if (event_ids) {
      event_ids.forEach((id) => { if (existingIds.has(id)) skipped.push(id); });
    }

    res.json({ imported: imported.length, skipped: skipped.length, reminders: imported });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calendar/push - push reminder to GCal
router.post('/push', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (!user.google_refresh_token) {
    res.status(400).json({ error: 'Google Calendar not connected' });
    return;
  }

  const { reminder_id } = req.body;
  const reminder = reminderSvc.getReminderById(reminder_id, user.id);
  if (!reminder) { res.status(404).json({ error: 'Reminder not found' }); return; }

  try {
    const start = new Date(reminder.due_at * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const event = await gcal.createCalendarEvent(
      user.id,
      reminder.title,
      start,
      end,
      reminder.description || undefined
    );
    res.json({ event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
