import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar';
import { CalendarEvent } from '../types';
import { useAuthStore } from '../store/authStore';
import GoogleConnect from '../components/calendar/GoogleConnect';
import { format } from 'date-fns';

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: () => calendarApi.events(),
    enabled: !!user?.googleConnected,
  });

  const importMutation = useMutation({
    mutationFn: (ids: string[]) => calendarApi.importEvents(ids),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      alert(`Imported ${data.imported} events as reminders`);
      setSelectedIds(new Set());
    },
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!user?.googleConnected) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Connect Google Calendar</h2>
        <p className="text-gray-400 mb-6">Import your events and get AI-powered scheduling suggestions.</p>
        <GoogleConnect />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Google Calendar</h1>
        <div className="flex items-center gap-3">
          <GoogleConnect />
          {selectedIds.size > 0 && (
            <button
              className="btn-primary"
              onClick={() => importMutation.mutate([...selectedIds])}
              disabled={importMutation.isPending}
            >
              Import {selectedIds.size} event{selectedIds.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No upcoming events in your calendar.</div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3">
            Select events to import as reminders. Showing next 30 days.
          </p>
          {events.map((event) => {
            const startStr = event.start.dateTime || event.start.date;
            const selected = event.id && selectedIds.has(event.id);
            return (
              <label
                key={event.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selected ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => event.id && toggle(event.id)}
                  className="rounded border-gray-300 text-primary-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{event.summary || 'Untitled'}</p>
                  {startStr && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(startStr), 'EEE, MMM d • h:mm a')}
                    </p>
                  )}
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">GCal</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
