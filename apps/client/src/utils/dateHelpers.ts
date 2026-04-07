import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export function fromUnix(ts: number): Date {
  return new Date(ts * 1000);
}

export function formatDueDate(ts: number): string {
  const date = fromUnix(ts);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatRelative(ts: number): string {
  return formatDistanceToNow(fromUnix(ts), { addSuffix: true });
}

export function isOverdue(ts: number): boolean {
  return isPast(fromUnix(ts));
}

export function toISOLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
