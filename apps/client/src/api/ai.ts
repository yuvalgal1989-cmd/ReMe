import api from './client';
import { AISuggestedSlot, FreeSlot } from '../types';

export const aiApi = {
  suggestTime: (reminder_id: number, desired_date?: string) =>
    api
      .post<{ suggestions: AISuggestedSlot[]; freeSlots: FreeSlot[] }>('/ai/suggest-time', {
        reminder_id,
        desired_date,
      })
      .then((r) => r.data),

  insights: (reminder_id: number) =>
    api.post<{ insight: string }>('/ai/insights', { reminder_id }).then((r) => r.data),
};
