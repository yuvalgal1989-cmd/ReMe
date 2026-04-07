export type ReminderCategory =
  | 'birthday'
  | 'anniversary'
  | 'payment'
  | 'meeting'
  | 'gym'
  | 'custom';

export type ReminderStatus = 'active' | 'snoozed' | 'completed' | 'archived';

export interface Contact {
  id: number;
  user_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: number;
}

export interface Reminder {
  id: number;
  user_id: number;
  contact_id: number | null;
  title: string;
  description: string | null;
  category: ReminderCategory;
  due_at: number;
  remind_before_minutes: number;
  rrule: string | null;
  status: ReminderStatus;
  snoozed_until: number | null;
  action_phone: string | null;
  action_email: string | null;
  action_whatsapp_msg: string | null;
  gcal_event_id: string | null;
  created_at: number;
  updated_at: number;
  contact?: Contact;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  googleConnected: boolean;
}

export interface AISuggestedSlot {
  slot: string;
  score: number;
  reason: string;
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
}

export const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  payment: 'Payment',
  meeting: 'Meeting',
  gym: 'Gym',
  custom: 'Custom',
};

export const CATEGORY_COLORS: Record<ReminderCategory, string> = {
  birthday: 'bg-pink-100 text-pink-700',
  anniversary: 'bg-rose-100 text-rose-700',
  payment: 'bg-amber-100 text-amber-700',
  meeting: 'bg-blue-100 text-blue-700',
  gym: 'bg-green-100 text-green-700',
  custom: 'bg-gray-100 text-gray-700',
};

export const CATEGORY_ICONS: Record<ReminderCategory, string> = {
  birthday: '🎂',
  anniversary: '💑',
  payment: '💳',
  meeting: '📅',
  gym: '💪',
  custom: '⭐',
};
