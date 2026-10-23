'use client';

import { useI18n, MessageKey } from '@/lib/i18n';
import { istDate, istToDate, istWeekday, minutesToLabel, WorkingBlock } from '@/lib/domain';

export interface Availability {
  hoursSet: boolean;
  workingHours: WorkingBlock[];
  unavailable: { start: string; end: string }[];
}

/** Text-first 7-day availability: working hours and merged "unavailable" periods only. */
export default function AvailabilityList({ data, days = 7 }: { data: Availability; days?: number }) {
  const { t, formatTime, formatDate } = useI18n();
  const today = istDate(new Date());
  const rows = Array.from({ length: days }, (_, i) => {
    const d = istDate(new Date(istToDate(today, 12 * 60).getTime() + i * 86400_000));
    const start = istToDate(d, 0);
    const end = new Date(start.getTime() + 86400_000);
    const wd = istWeekday(start);
    const hours = data.workingHours.filter((b) => b.weekday === wd).sort((a, b) => a.startMinute - b.startMinute);
    const busy = data.unavailable.filter((u) => new Date(u.start) < end && new Date(u.end) > start);
    return { d, wd, hours, busy, start, end };
  });

  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200">
      {rows.map((r, i) => (
        <li key={r.d} className="grid gap-1 p-3 text-sm sm:grid-cols-[150px_1fr]">
          <span className="font-semibold text-stone-900">
            {i === 0 ? t('common.today') : i === 1 ? t('common.tomorrow') : t(`day.${r.wd}` as MessageKey)}{' '}
            <span className="font-normal text-stone-600">{formatDate(r.start, { year: undefined })}</span>
          </span>
          <span className="space-y-0.5">
            <span className="block text-stone-800">
              {!data.hoursSet
                ? t('common.hoursNotSet')
                : r.hours.length
                  ? r.hours.map((h) => `${minutesToLabel(h.startMinute)} – ${minutesToLabel(h.endMinute)}`).join(', ')
                  : t('profile.closed')}
            </span>
            {r.busy.map((b) => (
              <span key={b.start} className="block text-stone-600">
                <span aria-hidden>■ </span>
                {t('common.unavailableAtThisTime')}: {formatTime(new Date(Math.max(new Date(b.start).getTime(), r.start.getTime())))} –{' '}
                {formatTime(new Date(Math.min(new Date(b.end).getTime(), r.end.getTime())))}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
