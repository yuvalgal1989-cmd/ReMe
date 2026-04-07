import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/client';
import GoogleConnect from '../components/calendar/GoogleConnect';
import FeatureUnavailable from '../components/shared/FeatureUnavailable';
import { useAuthStore } from '../store/authStore';

interface NotifSettings {
  email_enabled: number;
  notify_email: string | null;
  browser_enabled: number;
  smtp_host: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_from: string | null;
  smtp_pass_set: boolean;
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<Partial<NotifSettings & { smtp_pass: string }>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const { data } = useQuery<NotifSettings>({
    queryKey: ['notif-settings'],
    queryFn: () => api.get('/notifications/settings').then((r) => r.data),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (values: typeof form) => api.put('/notifications/settings', values),
    onSuccess: () => alert('Settings saved!'),
  });

  const handleTest = async () => {
    setTestStatus('idle');
    try {
      const { data } = await api.post('/notifications/test');
      setTestStatus(data.success ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
    }
  };

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <section className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Integrations</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Google Calendar</p>
            <p className="text-xs text-gray-400">Import events and get free slot suggestions</p>
          </div>
          <GoogleConnect />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Facebook</p>
          <FeatureUnavailable
            title="Facebook import not available"
            message="Facebook no longer allows third-party apps to read friend birthdays. Manual JSON import is coming soon."
          />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Notifications</h2>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!form.browser_enabled}
            onChange={(e) => set('browser_enabled', e.target.checked ? 1 : 0)}
            className="rounded"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Browser notifications</p>
            <p className="text-xs text-gray-400">Show desktop alerts when app is open</p>
          </div>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!form.email_enabled}
            onChange={(e) => set('email_enabled', e.target.checked ? 1 : 0)}
            className="rounded"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Email notifications</p>
            <p className="text-xs text-gray-400">Send email reminders (requires SMTP config)</p>
          </div>
        </label>

        {form.email_enabled ? (
          <div className="pl-6 space-y-3 border-l-2 border-gray-100">
            <div>
              <label className="label">Notify email</label>
              <input type="email" className="input" value={form.notify_email || ''} onChange={(e) => set('notify_email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">SMTP Host</label>
                <input className="input" value={form.smtp_host || ''} onChange={(e) => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="label">SMTP Port</label>
                <input type="number" className="input" value={form.smtp_port || 587} onChange={(e) => set('smtp_port', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="label">SMTP Username</label>
              <input className="input" value={form.smtp_user || ''} onChange={(e) => set('smtp_user', e.target.value)} placeholder="you@gmail.com" />
            </div>
            <div>
              <label className="label">SMTP Password {form.smtp_pass_set && '(set — leave blank to keep)'}</label>
              <input type="password" className="input" value={form.smtp_pass || ''} onChange={(e) => set('smtp_pass', e.target.value)} placeholder="App password..." />
            </div>
            <div>
              <label className="label">From address</label>
              <input className="input" value={form.smtp_from || ''} onChange={(e) => set('smtp_from', e.target.value)} placeholder="ReMe <you@gmail.com>" />
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary text-xs" onClick={handleTest}>Test connection</button>
              {testStatus === 'ok' && <span className="text-xs text-green-600">✓ Connected!</span>}
              {testStatus === 'fail' && <span className="text-xs text-red-600">✗ Failed. Check settings.</span>}
            </div>
          </div>
        ) : null}
      </section>

      <button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
