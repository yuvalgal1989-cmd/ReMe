import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import * as svc from '../services/reminderService';
import { User } from '../types';

function qs(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0] as string;
  return undefined;
}

function pid(req: Request, key = 'id'): number {
  const v = (req.params as Record<string, string | string[]>)[key];
  return parseInt(typeof v === 'string' ? v : (v as string[])[0], 10);
}

const router = Router();

router.use(requireAuth);

// GET /api/reminders
router.get('/', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const status = qs(req.query.status);
  const category = qs(req.query.category);
  const limit = qs(req.query.limit);
  const offset = qs(req.query.offset);
  const from = qs(req.query.from);
  const to = qs(req.query.to);
  const reminders = svc.getRemindersByUser(user.id, {
    status,
    category,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
    from: from ? parseInt(from) : undefined,
    to: to ? parseInt(to) : undefined,
  });
  res.json(reminders);
});

// GET /api/reminders/upcoming
router.get('/upcoming', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const withinHours = parseInt(qs(req.query.hours) || '24', 10);
  const reminders = svc.getUpcomingReminders(user.id, withinHours * 3600);
  res.json(reminders);
});

// GET /api/reminders/:id
router.get('/:id', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const reminder = svc.getReminderById(pid(req), user.id);
  if (!reminder) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(reminder);
});

// POST /api/reminders
router.post('/', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { title, description, category, due_at, remind_before_minutes, rrule,
          contact_id, action_phone, action_email, action_whatsapp_msg } = req.body;

  if (!title || !due_at) {
    res.status(400).json({ error: 'title and due_at are required' });
    return;
  }

  const reminder = svc.createReminder(user.id, {
    contact_id: contact_id ?? null,
    title,
    description: description ?? null,
    category: category || 'custom',
    due_at: typeof due_at === 'string' ? Math.floor(new Date(due_at).getTime() / 1000) : due_at,
    remind_before_minutes: remind_before_minutes ?? 60,
    rrule: rrule ?? null,
    action_phone: action_phone ?? null,
    action_email: action_email ?? null,
    action_whatsapp_msg: action_whatsapp_msg ?? null,
    gcal_event_id: null,
  });
  res.status(201).json(reminder);
});

// PUT /api/reminders/:id
router.put('/:id', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const id = pid(req);
  const updated = svc.updateReminder(id, user.id, req.body);
  if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(updated);
});

// PATCH /api/reminders/:id
router.patch('/:id', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const id = pid(req);
  const updated = svc.updateReminder(id, user.id, req.body);
  if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(updated);
});

// DELETE /api/reminders/:id
router.delete('/:id', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const deleted = svc.deleteReminder(pid(req), user.id);
  if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

// POST /api/reminders/:id/snooze
router.post('/:id/snooze', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { until, reason } = req.body;
  if (!until) { res.status(400).json({ error: 'until is required' }); return; }
  const untilTs = typeof until === 'string' ? Math.floor(new Date(until).getTime() / 1000) : until;
  const reminder = svc.snoozeReminder(pid(req), user.id, untilTs, reason);
  if (!reminder) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(reminder);
});

// POST /api/reminders/:id/complete
router.post('/:id/complete', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const reminder = svc.completeReminder(pid(req), user.id);
  if (!reminder) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(reminder);
});

// POST /api/reminders/:id/action
router.post('/:id/action', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { action_type, metadata } = req.body;
  if (!action_type) { res.status(400).json({ error: 'action_type is required' }); return; }
  svc.logAction(pid(req), user.id, action_type, metadata || {});
  res.json({ success: true });
});

export default router;
