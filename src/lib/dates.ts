import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/** "5 minutes ago", "2 days ago". */
export function fromNow(iso: string): string {
  return dayjs(iso).fromNow();
}

/** Chat-list style: time today, weekday this week, otherwise a short date. */
export function shortStamp(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('h:mm a');
  if (now.diff(d, 'day') < 7) return d.format('ddd');
  return d.format('D MMM');
}
