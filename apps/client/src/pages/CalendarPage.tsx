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

  const { data: events = [], isLoading, isFetching, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: () => calendarApi.events(),
    enabled: !!user?.googleConnected,
  });

  const { data: importedIds = [] } = useQuery<string[]>({
    queryKey: ['calendar-imported-ids'],
    queryFn: () => calendarApi.importedIds(),
    enabled: !!user?.googleConnected,
  });

  const importedSet = new Set(importedIds);
  const newEvents = events.filter((e) => e.id && !importedSet.has(e.id));

  const importMutation = useMutation({
    mutationFn: (ids: string[]) => calendarApi.importEvents(ids),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['calendar-imported-ids'] });
      setSelectedIds(new Set());
      alert(`Imported ${data.imported} events${data.skipped ? ` (${data.skipped} already existed)` : ''}`);
    },
  });

  const toggle = (id: string) => {
    if (importedSet.has(id)) return; // can't select already-imported
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Google Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ['calendar-imported-ids'] }); }}
            disabled={isFetching}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <span className={isFetching ? 'animate-spin inline-block' : ''}>↻</span>
            {isFetching ? 'Syncing...' : 'Refresh'}
          </button>
          <GoogleConnect />
        </div>
      </div>

      {/* Action bar */}
      {!isLoading && events.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {/* Import All New */}
          <button
            className="btn-primary text-sm"
            disabled={importMutation.isPending || newEvents.length === 0}
            onClick={() => importMutation.mutate(newEvents.map((e) => e.id!))}
          >
            {importMutation.isPending ? 'Importing...' : `Import All New (${newEvents.length})`}
          </button>

          {/* Import selected */}
          {selectedIds.size > 0 && (
            <button
              className="btn-secondary text-sm"
              disabled={importMutation.isPending}
              onClick={() => importMutation.mutate([...selectedIds])}
            >
              Import Selected ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No upcoming events in your calendar.</div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-3">Showing next 30 days · {newEvents.length} new · {importedIds.length} already imported</p>
          {events.map((event) => {
            const startStr = event.start.dateTime || event.start.date;
            const alreadyImported = event.id ? importedSet.has(event.id) : false;
            const selected = event.id ? selectedIds.has(event.id) : false;

            return (
              <div
                key={event.id}
                onClick={() => event.id && toggle(event.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  alreadyImported
                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-default'
                    : selected
                    ? 'border-primary-300 bg-primary-50 cursor-pointer'
                    : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {/* Checkbox / check */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {alreadyImported ? (
                    <span className="text-green-500 text-base">✓</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-primary-600"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${alreadyImported ? 'text-gray-400' : 'text-gray-900'}`}>
                    {event.summary || 'Untitled'}
                  </p>
                  {startStr && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(startStr), 'EEE, MMM d • h:mm a')}
                    </p>
                  )}
                </div>

                {alreadyImported ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Imported</span>
                ) : (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">New</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
