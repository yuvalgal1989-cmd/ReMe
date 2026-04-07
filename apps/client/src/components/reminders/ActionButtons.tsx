import { useState } from 'react';
import { Reminder, AISuggestedSlot } from '../../types';
import { buildCallLink, buildWhatsAppLink, buildEmailLink } from '../../utils/actionLinks';
import { remindersApi } from '../../api/reminders';
import { aiApi } from '../../api/ai';
import Modal from '../shared/Modal';
import FeatureUnavailable from '../shared/FeatureUnavailable';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  reminder: Reminder;
  compact?: boolean;
}

export default function ActionButtons({ reminder, compact = false }: Props) {
  const qc = useQueryClient();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestedSlot[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const phone = reminder.action_phone || reminder.contact?.phone || '';
  const email = reminder.action_email || reminder.contact?.email || '';
  const whatsappMsg = reminder.action_whatsapp_msg || `Hi, I'm reaching out about: ${reminder.title}`;

  const handleSnoozeOpen = async () => {
    setSnoozeOpen(true);
    setAiUnavailable(false);
    setLoadingSuggestions(true);
    try {
      const { suggestions } = await aiApi.suggestTime(reminder.id);
      setSuggestions(suggestions);
    } catch {
      setSuggestions([]);
      setAiUnavailable(true);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSnooze = async (until: string) => {
    await remindersApi.snooze(reminder.id, until);
    qc.invalidateQueries({ queryKey: ['reminders'] });
    setSnoozeOpen(false);
  };

  const handleComplete = async () => {
    await remindersApi.complete(reminder.id);
    qc.invalidateQueries({ queryKey: ['reminders'] });
  };

  const logAndOpen = (link: string, actionType: string) => {
    remindersApi.logAction(reminder.id, actionType).catch(() => {});
    window.open(link, '_blank');
  };

  const btnClass = compact
    ? 'flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-colors hover:bg-gray-50'
    : 'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors hover:bg-gray-50';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {phone && (
          <button
            className={`${btnClass} border-emerald-300 text-emerald-700 hover:bg-emerald-50`}
            onClick={() => logAndOpen(buildCallLink(phone), 'called')}
          >
            📞 {compact ? '' : 'Call'}
          </button>
        )}
        {phone && (
          <button
            className={`${btnClass} border-green-300 text-green-700 hover:bg-green-50`}
            onClick={() => logAndOpen(buildWhatsAppLink(phone, whatsappMsg), 'whatsapped')}
          >
            💬 {compact ? '' : 'WhatsApp'}
          </button>
        )}
        {email && (
          <button
            className={`${btnClass} border-blue-300 text-blue-700 hover:bg-blue-50`}
            onClick={() => logAndOpen(buildEmailLink(email, reminder.title), 'emailed')}
          >
            ✉️ {compact ? '' : 'Email'}
          </button>
        )}
        <button
          className={`${btnClass} border-amber-300 text-amber-700 hover:bg-amber-50`}
          onClick={handleSnoozeOpen}
        >
          ⏰ {compact ? '' : 'Snooze'}
        </button>
        <button
          className={`${btnClass} border-gray-300 text-gray-600 hover:bg-gray-50`}
          onClick={handleComplete}
        >
          ✓ {compact ? '' : 'Done'}
        </button>
      </div>

      <Modal open={snoozeOpen} onClose={() => setSnoozeOpen(false)} title="Snooze Reminder">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            When would you like to be reminded again?
          </p>

          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Getting AI suggestions...
            </div>
          ) : aiUnavailable ? (
            <FeatureUnavailable
              title="AI suggestions unavailable"
              message="Add ANTHROPIC_API_KEY to your server .env to enable smart scheduling."
            />
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Suggested Times</p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSnooze(s.slot)}
                  className="w-full text-left p-3 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {format(new Date(s.slot), 'EEE, MMM d • h:mm a')}
                    </span>
                    <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                      Score: {s.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.reason}</p>
                </button>
              ))}
            </div>
          ) : null}

          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Custom Time</p>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                className="input flex-1"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
              <button
                className="btn-primary"
                disabled={!customDate}
                onClick={() => handleSnooze(new Date(customDate).toISOString())}
              >
                Set
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { label: '1 hour', ms: 3600000 },
              { label: '3 hours', ms: 10800000 },
              { label: 'Tomorrow', ms: 86400000 },
              { label: 'Next week', ms: 604800000 },
            ].map((opt) => (
              <button
                key={opt.label}
                className="btn-secondary text-xs"
                onClick={() => handleSnooze(new Date(Date.now() + opt.ms).toISOString())}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
