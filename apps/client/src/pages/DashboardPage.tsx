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

  // Current month boundaries
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  const monthName  = today.toLocaleDateString('en-US', { month: 'long' });

  // ── Regular reminders ─────────────────────────────────────────────────────

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

  // ── Yearly events for the current month ───────────────────────────────────

  const monthKey = `${today.getFullYear()}-${today.getMonth()}`;

  const { data: birthdaysMonth = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'birthdays-month', monthKey],
    queryFn: () => remindersApi.list({
      status: 'active',
      category: 'birthday',
      from: Math.floor(monthStart.getTime() / 1000),
      to: Math.floor(monthEnd.getTime() / 1000),
      limit: 50,
    }),
    staleTime: 0,
  });

  const { data: anniversariesMonth = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'anniversaries-month', monthKey],
    queryFn: () => remindersApi.list({
      status: 'active',
      category: 'anniversary',
      from: Math.floor(monthStart.getTime() / 1000),
      to: Math.floor(monthEnd.getTime() / 1000),
      limit: 50,
    }),
    staleTime: 0,
  });

  // Combine + deduplicate this month's yearly events
  const yearlyThisMonth = [...birthdaysMonth, ...anniversariesMonth]
    .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
    .sort((a, b) => a.due_at - b.due_at);

  // ── Filters — always exclude yearly by category ───────────────────────────

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

  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const hasAnything = overdue.length > 0 || upcomingRegular.length > 0 ||
    weekItems.length > 0 || yearlyThisMonth.length > 0;

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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
          { label: 'Due Today', value: upcomingRegular.length, color: upcomingRegular.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'This Week', value: weekItems.length + upcomingRegular.length, color: 'text-blue-600' },
          { label: 'Overdue',   value: overdue.length, color: overdue.length > 0 ? 'text-red-600' : 'text-gray-400' },
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

      {/* Birthdays & Anniversaries this month */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-pink-600 uppercase tracking-wide">
            🎂 {monthName} — Birthdays & Anniversaries
          </h2>
          {yearlyThisMonth.length > 0 && (
            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
              {yearlyThisMonth.length}
            </span>
          )}
        </div>

        {yearlyThisMonth.length > 0 ? (
          <div className="space-y-3">
            {yearlyThisMonth.map((r) => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        ) : (
          <div className="card text-center py-6">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-gray-400">No birthdays or anniversaries in {monthName}</p>
          </div>
        )}
      </section>

      {/* Empty state — only when no sections at all */}
      {!hasAnything && yearlyThisMonth.length === 0 && (
        <div className="text-center py-8">
          <button className="btn-primary" onClick={() => setCreating(true)}>Add a reminder</button>
        </div>
      )}

      <ReminderForm open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
