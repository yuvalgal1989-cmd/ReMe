export type ReminderCategory =
  | 'birthday'
  | 'anniversary'
  | 'payment'
  | 'meeting'
  | 'gym'
  | 'custom';

export type ReminderStatus = 'active' | 'snoozed' | 'completed' | 'archived';

export type ActionType =
  | 'snoozed'
  | 'completed'
  | 'called'
  | 'whatsapped'
  | 'emailed'
  | 'dismissed';

export interface User {
  id: number;
  email: string;
  name: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: number | null;
  google_calendar_id: string;
  created_at: number;
  updated_at: number;
}

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
}

export interface ReminderWithContact extends Reminder {
  contact?: Contact;
}

export interface ActionLog {
  id: number;
  reminder_id: number;
  user_id: number;
  action_type: ActionType;
  metadata: string | null;
  performed_at: number;
}

export interface NotificationSettings {
  user_id: number;
  email_enabled: number;
  notify_email: string | null;
  browser_enabled: number;
  smtp_host: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_pass: string | null;
  smtp_from: string | null;
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface AISuggestedSlot {
  slot: string;
  score: number;
  reason: string;
}

// Express session augmentation
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    oauthState?: string;
  }
}
