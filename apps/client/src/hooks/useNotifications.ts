import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { remindersApi } from '../api/reminders';
import { Reminder } from '../types';
import { CATEGORY_ICONS } from '../types';

const notifiedIds = new Set<number>();

// Browser Notification API is not available in iOS WebView (Capacitor)
const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;

export function useNotifications() {
  const requestPermission = useCallback(async () => {
    if (notificationsSupported && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const { data: upcoming = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'upcoming'],
    queryFn: () => remindersApi.upcoming(1),
    refetchInterval: 60000,
    enabled: notificationsSupported,
  });

  useEffect(() => {
    if (!notificationsSupported) return;
    if (Notification.permission !== 'granted') return;

    for (const reminder of upcoming) {
      if (notifiedIds.has(reminder.id)) continue;
      notifiedIds.add(reminder.id);

      const icon = CATEGORY_ICONS[reminder.category];
      new Notification(`${icon} ${reminder.title}`, {
        body: reminder.contact?.name
          ? `Reminder for ${reminder.contact.name}`
          : reminder.description || 'Tap to view',
        icon: '/favicon.ico',
        tag: `reminder-${reminder.id}`,
      });
    }
  }, [upcoming]);

  const permissionGranted = notificationsSupported && Notification.permission === 'granted';

  return { requestPermission, permissionGranted };
}
