import api from './client';
import { Reminder, ReminderCategory } from '../types';

export interface CreateReminderInput {
  title: string;
  description?: string;
  category: ReminderCategory;
  due_at: string; // ISO string
  remind_before_minutes?: number;
  rrule?: string;
  contact_id?: number;
  action_phone?: string;
  action_email?: string;
  action_whatsapp_msg?: string;
}

export const remindersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Reminder[]>('/reminders', { params }).then((r) => r.data),

  upcoming: (hours = 24) =>
    api.get<Reminder[]>('/reminders/upcoming', { params: { hours } }).then((r) => r.data),

  get: (id: number) => api.get<Reminder>(`/reminders/${id}`).then((r) => r.data),

  create: (data: CreateReminderInput) =>
    api.post<Reminder>('/reminders', data).then((r) => r.data),

  update: (id: number, data: Partial<CreateReminderInput>) =>
    api.put<Reminder>(`/reminders/${id}`, data).then((r) => r.data),

  patch: (id: number, data: Partial<Reminder>) =>
    api.patch<Reminder>(`/reminders/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/reminders/${id}`).then((r) => r.data),

  snooze: (id: number, until: string, reason?: string) =>
    api.post<Reminder>(`/reminders/${id}/snooze`, { until, reason }).then((r) => r.data),

  complete: (id: number) =>
    api.post<Reminder>(`/reminders/${id}/complete`).then((r) => r.data),

  logAction: (id: number, action_type: string, metadata?: Record<string, unknown>) =>
    api.post(`/reminders/${id}/action`, { action_type, metadata }).then((r) => r.data),
};
