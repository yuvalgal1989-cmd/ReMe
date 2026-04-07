import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { User } from '../types';
import * as reminderSvc from '../services/reminderService';
import * as ai from '../services/anthropicService';
import * as gcal from '../services/googleCalendarService';

const router = Router();
router.use(requireAuth);

// POST /api/ai/suggest-time
router.post('/suggest-time', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { reminder_id, desired_date } = req.body;

  if (!reminder_id) { res.status(400).json({ error: 'reminder_id required' }); return; }

  const reminder = reminderSvc.getReminderById(reminder_id, user.id);
  if (!reminder) { res.status(404).json({ error: 'Reminder not found' }); return; }

  const actionHistory = reminderSvc.getActionHistory(reminder_id);

  let freeSlots: any[] = [];
  if (user.google_refresh_token) {
    try {
      const date = desired_date ? new Date(desired_date) : new Date();
      freeSlots = await gcal.findFreeSlots(user.id, date, 30);
    } catch {
      // Calendar not available, continue without slots
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback without AI: just return free slots
    const suggestions = freeSlots.slice(0, 3).map((s: any, i: number) => ({
      slot: s.start,
      score: 8 - i * 2,
      reason: 'Available time slot in your calendar',
    }));
    res.json({ suggestions, freeSlots });
    return;
  }

  try {
    const suggestions = await ai.suggestOptimalTimes(reminder, freeSlots, actionHistory);
    res.json({ suggestions, freeSlots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/insights
router.post('/insights', async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { reminder_id } = req.body;

  if (!reminder_id) { res.status(400).json({ error: 'reminder_id required' }); return; }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'AI not configured' });
    return;
  }

  const reminder = reminderSvc.getReminderById(reminder_id, user.id);
  if (!reminder) { res.status(404).json({ error: 'Reminder not found' }); return; }

  const actionHistory = reminderSvc.getActionHistory(reminder_id);

  try {
    const insight = await ai.generateInsight(reminder, actionHistory);
    res.json({ insight });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
