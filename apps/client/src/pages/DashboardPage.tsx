import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { remindersApi } from '../api/reminders';
import { Reminder } from '../types';
import { isOverdue } from '../utils/dateHelpers';
import ReminderCard from '../components/reminders/ReminderCard';
import ReminderForm from '../components/reminders/ReminderForm';
import GoogleConnect from '../components/calendar/GoogleConnect';
import { useAuthStore } from '../store/authStore';

const now = () => Math.floor(Date.now() / 1000);
const YEARLY_CATEGORIES = new Set(['birthday', 'anniversary']);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [creating, setCreating] = useState(false);

  // ── Regular reminders (NOT birthday/anniversary) ──────────────────────────

  const { data: upcoming = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'upcoming-24h'],
    queryFn: () => remindersApi.upcoming(24),
  });

  const { data: thisWeek = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'this-week'],
    queryFn: () => remindersApi.list({
      status: 'active',
      from: now(),
      to: now() + 7 * 86400,
      limit: 50,
    }),
  });

  // ── Yearly events — fetched separately by category ────────────────────────

  const { data: birthdays = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'birthdays'],
    queryFn: () => remindersApi.list({
      status: 'active',
      category: 'birthday',
      from: now(),
      to: now() + 30 * 86400,
      limit: 50,
    }),
  });

  const { data: anniversaries = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'anniversaries'],
    queryFn: () => remindersApi.list({
      status: 'active',
      category: 'anniversary',
      from: now(),
      to: now() + 30 * 86400,
      limit: 50,
    }),
  });

  // Combine + deduplicate yearly events
  const yearlyEvents = [...birthdays, ...anniversaries]
    .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);

  const yearlyIds = new Set(yearlyEvents.map((r) => r.id));

  // ── Filter regular sections — always exclude by category directly ─────────

  const isYearly = (r: Reminder) => YEARLY_CATEGORIES.has(r.category);

  const upcomingRegular = upcoming.filter((r) => !isYearly(r));
  const upcomingIds = new Set(upcomingRegular.map((r) => r.id));

  const overdue = thisWeek.filter(
    (r) => isOverdue(r.due_at) && !isYearly(r) && !upcomingIds.has(r.id)
  );

  const weekItems = thisWeek
    .filter((r) => !isOverdue(r.due_at) && !isYearly(r) && !upcomingIds.has(r.id))
    .slice(0, 5);

  // ── Greeting ──────────────────────────────────────────────────────────────

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const hasAnything = overdue.length > 0 || upcomingRegular.length > 0 ||
    weekItems.length > 0 || yearlyEvents.length > 0;

  return (
    <div className="space-y-6">

      {/* Greeting */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Due Today',  value: upcomingRegular.length, color: upcomingRegular.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'This Week',  value: weekItems.length + upcomingRegular.length, color: 'text-blue-600' },
          { label: 'Overdue',    value: overdue.length, color: overdue.length > 0 ? 'text-red-600' : 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
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
      {upcomingRegular.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            🔔 Due in 24 Hours ({upcomingRegular.length})
          </h2>
          <div className="space-y-3">
            {upcomingRegular.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* This week */}
      {weekItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            📋 Coming Up This Week
          </h2>
          <div className="space-y-3">
            {weekItems.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* Birthdays & Anniversaries — always separate */}
      {yearlyEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
              🎂 Birthdays & Anniversaries
            </h2>
            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
              Next 30 days
            </span>
          </div>
          <div className="space-y-3">
            {yearlyEvents.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasAnything && (
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
