import api from './client';
import { CalendarEvent, FreeSlot } from '../types';

export const calendarApi = {
  events: (from?: string, to?: string) =>
    api.get<CalendarEvent[]>('/calendar/events', { params: { from, to } }).then((r) => r.data),

  freeSlots: (date?: string, duration_minutes = 30) =>
    api.get<FreeSlot[]>('/calendar/free-slots', { params: { date, duration_minutes } }).then((r) => r.data),

  importEvents: (event_ids?: string[]) =>
    api.post('/calendar/import', { event_ids }).then((r) => r.data),

  pushReminder: (reminder_id: number) =>
    api.post('/calendar/push', { reminder_id }).then((r) => r.data),
};
