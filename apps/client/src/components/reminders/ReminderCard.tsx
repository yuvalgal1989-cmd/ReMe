import { useState } from 'react';
import { Reminder, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../types';
import { formatDueDate, formatRelative, isOverdue } from '../../utils/dateHelpers';
import ActionButtons from './ActionButtons';
import ReminderForm from './ReminderForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '../../api/reminders';

interface Props {
  reminder: Reminder;
}

export default function ReminderCard({ reminder }: Props) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => remindersApi.delete(reminder.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const overdue = isOverdue(reminder.due_at) && reminder.status === 'active';

  return (
    <>
      <div className={`card ${overdue ? 'border-red-200 bg-red-50' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="text-xl mt-0.5 flex-shrink-0">{CATEGORY_ICONS[reminder.category]}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">{reminder.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[reminder.category]}`}>
                  {CATEGORY_LABELS[reminder.category]}
                </span>
                {reminder.rrule && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">recurring</span>
                )}
                {reminder.status === 'snoozed' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">snoozed</span>
                )}
              </div>

              {reminder.contact?.name && (
                <p className="text-sm text-gray-500 mt-0.5">👤 {reminder.contact.name}</p>
              )}

              <p className={`text-sm mt-1 font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                {overdue ? '⚠️ ' : ''}
                {formatDueDate(reminder.due_at)}
                <span className="font-normal text-gray-400 ml-1.5">({formatRelative(reminder.due_at)})</span>
              </p>

              {reminder.status === 'snoozed' && reminder.snoozed_until && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Snoozed until {formatDueDate(reminder.snoozed_until)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Toggle details"
            >
              {expanded ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => { if (confirm('Archive this reminder?')) deleteMutation.mutate(); }}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              title="Archive"
            >
              🗑️
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {reminder.description && (
              <p className="text-sm text-gray-600 mb-3">{reminder.description}</p>
            )}
            <ActionButtons reminder={reminder} />
          </div>
        )}

        {!expanded && (
          <div className="mt-3">
            <ActionButtons reminder={reminder} compact />
          </div>
        )}
      </div>

      <ReminderForm open={editing} onClose={() => setEditing(false)} existing={reminder} />
    </>
  );
}
