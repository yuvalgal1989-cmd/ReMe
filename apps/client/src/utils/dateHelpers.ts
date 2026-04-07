import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export function fromUnix(ts: number): Date {
  return new Date(ts * 1000);
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

export function formatDueDate(ts: number): string {
  if (!ts) return 'No date';
  const date = fromUnix(ts);
  if (!isValidDate(date)) return 'Invalid date';
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatRelative(ts: number): string {
  if (!ts) return '';
  const date = fromUnix(ts);
  if (!isValidDate(date)) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function isOverdue(ts: number): boolean {
  if (!ts) return false;
  const date = fromUnix(ts);
  if (!isValidDate(date)) return false;
  return isPast(date);
}

export function toISOLocal(date: Date): string {
  if (!isValidDate(date)) {
    // Fall back to now if an invalid date is passed
    date = new Date();
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
