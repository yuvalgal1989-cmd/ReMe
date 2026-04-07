import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi, CreateReminderInput } from '../../api/reminders';
import { Contact, Reminder, ReminderCategory, CATEGORY_LABELS } from '../../types';
import { toISOLocal } from '../../utils/dateHelpers';
import Modal from '../shared/Modal';
import api from '../../api/client';

const CATEGORIES: ReminderCategory[] = ['birthday', 'anniversary', 'payment', 'meeting', 'gym', 'custom'];

const RRULE_OPTIONS = [
  { label: 'No recurrence', value: '' },
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekly', value: 'FREQ=WEEKLY' },
  { label: 'Monthly', value: 'FREQ=MONTHLY' },
  { label: 'Yearly', value: 'FREQ=YEARLY' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Reminder;
}

function isDateOnly(cat: ReminderCategory) {
  return cat === 'birthday' || cat === 'anniversary';
}

export default function ReminderForm({ open, onClose, existing }: Props) {
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('custom');
  const [dueAt, setDueAt] = useState('');
  const [remindAtTime, setRemindAtTime] = useState('09:00');
  const [remindBefore, setRemindBefore] = useState(60);
  const [rrule, setRrule] = useState('');
  const [contactId, setContactId] = useState<number | ''>('');
  const [actionPhone, setActionPhone] = useState('');
  const [actionEmail, setActionEmail] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
  });

  useEffect(() => {
    if (existing) {
      const localDt = toISOLocal(existing.due_at ? new Date(existing.due_at * 1000) : new Date());
      setTitle(existing.title);
      setDescription(existing.description || '');
      setCategory(existing.category);
      setDueAt(localDt);
      setRemindAtTime(localDt.slice(11, 16));
      setRemindBefore(existing.remind_before_minutes);
      setRrule(existing.rrule || '');
      setContactId(existing.contact_id || '');
      setActionPhone(existing.action_phone || '');
      setActionEmail(existing.action_email || '');
      setActionMsg(existing.action_whatsapp_msg || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('custom');
      setDueAt(toISOLocal(new Date(Date.now() + 3600000)));
      setRemindAtTime('09:00');
      setRemindBefore(60);
      setRrule('');
      setContactId('');
      setActionPhone('');
      setActionEmail('');
      setActionMsg('');
    }
  }, [existing, open]);

  const handleCategoryChange = (newCategory: ReminderCategory) => {
    setCategory(newCategory);
    if (!existing && isDateOnly(newCategory)) {
      setRrule('FREQ=YEARLY');
      setRemindBefore(1440);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: CreateReminderInput) =>
      existing ? remindersApi.update(existing.id, data) : remindersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.refetchQueries({ queryKey: ['reminders'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const due = isDateOnly(category)
      ? new Date(dueAt.slice(0, 10) + 'T' + remindAtTime).toISOString()
      : new Date(dueAt).toISOString();
    mutation.mutate({
      title,
      description: description || undefined,
      category,
      due_at: due,
      remind_before_minutes: remindBefore,
      rrule: rrule || undefined,
      contact_id: contactId ? Number(contactId) : undefined,
      action_phone: actionPhone || undefined,
      action_email: actionEmail || undefined,
      action_whatsapp_msg: actionMsg || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Reminder' : 'New Reminder'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Mom's Birthday" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => handleCategoryChange(e.target.value as ReminderCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Contact</label>
            <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— None —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isDateOnly(category) ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Due Date *</label>
                <input
                  type="date"
                  className="input"
                  value={dueAt.slice(0, 10)}
                  onChange={(e) => setDueAt(e.target.value + 'T00:00')}
                  required
                />
              </div>
              <div>
                <label className="label">Remind at time</label>
                <input
                  type="time"
                  className="input"
                  value={remindAtTime}
                  onChange={(e) => setRemindAtTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Remind Before (days)</label>
                <input
                  type="number"
                  className="input"
                  value={Math.round(remindBefore / 1440)}
                  onChange={(e) => setRemindBefore(Number(e.target.value) * 1440)}
                  min={0}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date & Time *</label>
              <input type="datetime-local" className="input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
            </div>
            <div>
              <label className="label">Remind Before (minutes)</label>
              <input type="number" className="input" value={remindBefore} onChange={(e) => setRemindBefore(Number(e.target.value))} min={0} />
            </div>
          </div>
        )}

        <div>
          <label className="label">Recurrence</label>
          <select className="input" value={rrule} onChange={(e) => setRrule(e.target.value)}>
            {RRULE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes..." />
        </div>

        <details className="group">
          <summary className="text-sm font-medium text-gray-600 cursor-pointer select-none">
            Action Details (phone, email for quick actions)
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Phone (for Call & WhatsApp)</label>
              <input className="input" value={actionPhone} onChange={(e) => setActionPhone(e.target.value)} placeholder="+1234567890" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={actionEmail} onChange={(e) => setActionEmail(e.target.value)} placeholder="contact@example.com" />
            </div>
            <div>
              <label className="label">Default WhatsApp Message</label>
              <input className="input" value={actionMsg} onChange={(e) => setActionMsg(e.target.value)} placeholder="Hi! Just thinking of you..." />
            </div>
          </div>
        </details>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : existing ? 'Save Changes' : 'Create Reminder'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
