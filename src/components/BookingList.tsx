'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Avatar, BookingStatusBadge, useBookingTitle } from './domain';

export interface BookingRow {
  id: string;
  bookingNumber: string;
  status: string;
  serviceTitle: string;
  category: string;
  serviceRequestId: string | null;
  startsAt: string;
  agreedPrice: number | null;
  address: { locality: string; city: string };
  worker: { name: string; avatarUrl: string | null };
  customer: { name: string };
}

export const ACTIVE = ['pending', 'accepted', 'confirmed', 'in_progress'];

export default function BookingList({ bookings, as }: { bookings: BookingRow[]; as: 'customer' | 'worker' }) {
  const { formatDateTime, formatMoney } = useI18n();
  const title = useBookingTitle();
  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link href={`/bookings/${b.id}`} className="flex items-center gap-3 p-4 hover:bg-stone-50">
            {as === 'customer' && <Avatar src={b.worker.avatarUrl} name={b.worker.name} size={40} />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-stone-900">{title(b)}</p>
              <p className="truncate text-sm text-stone-700">
                {as === 'customer' ? b.worker.name : b.customer.name} · {formatDateTime(b.startsAt)}
              </p>
              <p className="truncate text-sm text-stone-600">
                {b.address.locality}, {b.address.city}
                {b.agreedPrice !== null && ` · ${formatMoney(b.agreedPrice)}`}
              </p>
            </div>
            <div className="flex flex-none flex-col items-end gap-1">
              <BookingStatusBadge status={b.status} />
              <ChevronRight className="h-4 w-4 text-stone-400" aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
