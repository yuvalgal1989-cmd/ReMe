import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { ReminderWithContact, FreeSlot, AISuggestedSlot } from '../types';

function getClient() {
  if (!config.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey: config.anthropicApiKey });
}

export async function suggestOptimalTimes(
  reminder: ReminderWithContact,
  freeSlots: FreeSlot[],
  actionHistory: any[]
): Promise<AISuggestedSlot[]> {
  if (freeSlots.length === 0) return [];

  const client = getClient();

  const historyText = actionHistory.length > 0
    ? actionHistory
        .slice(0, 5)
        .map((a) => `${a.action_type} at ${new Date(a.performed_at * 1000).toLocaleString()}`)
        .join(', ')
    : 'No previous actions';

  const slotsText = freeSlots
    .slice(0, 10)
    .map((s, i) => `${i + 1}. ${s.start} to ${s.end} (${s.durationMinutes} min free)`)
    .join('\n');

  const prompt = `You are a scheduling assistant. Given these free time slots and context, rank the best 3 slots for completing the action.

Reminder: "${reminder.title}"
Category: ${reminder.category}
Contact: ${reminder.contact?.name || 'N/A'}
Action history: ${historyText}

Available free slots:
${slotsText}

Today: ${new Date().toISOString()}

Respond ONLY with a valid JSON array of exactly 3 objects. No markdown, no explanation.
Each object must have: "slot" (ISO 8601 string from the available slots), "score" (integer 1-10), "reason" (max 15 words).

Example: [{"slot":"2024-01-15T09:00:00.000Z","score":9,"reason":"Morning is best for calls, you have plenty of time"}]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as any).text as string;

  try {
    const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3) as AISuggestedSlot[];
    }
  } catch {
    // If parsing fails, return first 3 slots with default scores
  }

  return freeSlots.slice(0, 3).map((s, i) => ({
    slot: s.start,
    score: 8 - i * 2,
    reason: 'Available time slot',
  }));
}

export async function generateInsight(
  reminder: ReminderWithContact,
  actionHistory: any[]
): Promise<string> {
  const client = getClient();

  const historyText = actionHistory.length > 0
    ? actionHistory
        .slice(0, 5)
        .map((a) => `${a.action_type} at ${new Date(a.performed_at * 1000).toLocaleString()}`)
        .join('; ')
    : 'No previous interactions recorded';

  const daysUntilDue = Math.ceil((reminder.due_at - Date.now() / 1000) / 86400);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Give a brief, helpful insight (2 sentences max) for this reminder.
Reminder: "${reminder.title}" (${reminder.category})
Contact: ${reminder.contact?.name || 'N/A'}
Due: ${daysUntilDue} days from now
History: ${historyText}
Be specific and actionable. Do not repeat the reminder title.`,
      },
    ],
  });

  return (response.content[0] as any).text as string;
}
