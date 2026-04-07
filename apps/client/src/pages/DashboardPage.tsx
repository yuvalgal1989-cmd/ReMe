import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { remindersApi } from '../api/reminders';
import { Reminder, CATEGORY_ICONS } from '../types';
import { formatDueDate, isOverdue } from '../utils/dateHelpers';
import ReminderCard from '../components/reminders/ReminderCard';
import ReminderForm from '../components/reminders/ReminderForm';
import GoogleConnect from '../components/calendar/GoogleConnect';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [creating, setCreating] = useState(false);

  const { data: upcoming = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'upcoming-dashboard'],
    queryFn: () => remindersApi.upcoming(24),
  });

  const { data: thisWeek = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'this-week'],
    queryFn: () => remindersApi.list({
      status: 'active',
      from: Math.floor(Date.now() / 1000),
      to: Math.floor(Date.now() / 1000) + 7 * 86400,
      limit: 20,
    }),
  });

  const overdue = thisWeek.filter((r) => isOverdue(r.due_at));
  const todayItems = thisWeek.filter((r) => !isOverdue(r.due_at)).slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GoogleConnect />
          <button className="btn-primary" onClick={() => setCreating(true)}>+ Reminder</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Due Today', value: upcoming.length, color: upcoming.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'This Week', value: thisWeek.length, color: 'text-blue-600' },
          { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? 'text-red-600' : 'text-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">
            ⚠️ Overdue ({overdue.length})
          </h2>
          <div className="space-y-3">
            {overdue.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* Due in 24h */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Due in 24 hours ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* This week */}
      {todayItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Coming Up This Week
          </h2>
          <div className="space-y-3">
            {todayItems.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {thisWeek.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-700">All clear!</h2>
          <p className="text-gray-400 mt-1">No upcoming reminders. Enjoy your day!</p>
          <button className="btn-primary mt-4" onClick={() => setCreating(true)}>Add a reminder</button>
        </div>
      )}

      <ReminderForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
