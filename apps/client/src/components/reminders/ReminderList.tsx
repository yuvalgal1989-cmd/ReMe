import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { remindersApi } from '../../api/reminders';
import { Reminder, ReminderCategory, CATEGORY_LABELS } from '../../types';
import ReminderCard from './ReminderCard';
import ReminderForm from './ReminderForm';

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'snoozed', label: 'Snoozed' },
  { value: 'completed', label: 'Completed' },
];

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Categories' },
  ...(['birthday', 'anniversary', 'payment', 'meeting', 'gym', 'custom'] as ReminderCategory[]).map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  })),
];

export default function ReminderList() {
  const [status, setStatus] = useState('active');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: raw = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ['reminders', { status, category }],
    queryFn: () => remindersApi.list({ ...(status ? { status } : {}), ...(category ? { category } : {}) }),
  });

  // Deduplicate by id
  const reminders = raw.filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Reminders</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>+ New</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                status === s.value ? 'bg-white shadow-sm font-medium text-primary-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-400">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No reminders found</p>
          <button className="btn-primary mt-3" onClick={() => setCreating(true)}>Create your first reminder</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => <ReminderCard key={r.id} reminder={r} />)}
        </div>
      )}

      <ReminderForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
