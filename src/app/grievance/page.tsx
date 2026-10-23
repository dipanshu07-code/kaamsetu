'use client';

import React, { useState } from 'react';
import { LifeBuoy, PhoneCall } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { Alert, Badge, Button, EmptyState, LinkButton, PageHeader, Section, SelectField, Spinner, TextArea, TextField, useApiError, useFieldErrors, useLoad } from '@/components/ui';

interface Complaint {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
}

const CATEGORIES = ['no_show', 'poor_work_quality', 'billing_dispute', 'unprofessional_behavior', 'safety_concern', 'other'] as const;

function ComplaintForm({ onCreated }: { onCreated: (ticket: string) => void }) {
  const { t, tk, formatDate } = useI18n();
  const errorText = useApiError();
  const fieldErrors = useFieldErrors();
  const { user } = useSession();
  const { data: bookings } = useLoad(
    () => (user && user.role !== 'admin' && user.role !== 'employer' ? api.get<{ bookings: { id: string; serviceTitle: string; startsAt: string; bookingNumber: string }[] }>('/api/bookings').then((r) => r.bookings) : Promise.resolve([])),
    [user?.id],
  );
  const [f, setF] = useState({ bookingId: '', category: 'other', subject: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const v: Record<string, string> = {};
        if (f.subject.trim().length < 3) v.subject = t('validation.too_short');
        if (f.description.trim().length < 10) v.description = t('validation.too_short');
        setErrors(v);
        if (Object.keys(v).length) return;
        setBusy(true);
        setErr(null);
        try {
          const res = await api.post<{ ticketNumber: string }>('/api/complaints', { ...f, bookingId: f.bookingId || null });
          setF({ bookingId: '', category: 'other', subject: '', description: '' });
          onCreated(res.ticketNumber);
        } catch (e2) {
          setErr(errorText(e2));
          setErrors(fieldErrors(e2));
        } finally {
          setBusy(false);
        }
      }}
    >
      {err && <Alert tone="error">{err}</Alert>}
      <Alert tone="warning">{t('complaint.safetyNote')}</Alert>
      <SelectField label={t('griev.booking')} value={f.bookingId} onChange={(e) => setF({ ...f, bookingId: e.target.value })}>
        <option value="">{t('griev.noBooking')}</option>
        {(bookings || []).map((b) => (
          <option key={b.id} value={b.id}>
            {b.serviceTitle} · {formatDate(b.startsAt)} ({b.bookingNumber})
          </option>
        ))}
      </SelectField>
      <SelectField label={t('complaint.category')} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {tk('complaint.cat', c)}
          </option>
        ))}
      </SelectField>
      <TextField label={t('complaint.subject')} value={f.subject} error={errors.subject} maxLength={200} required onChange={(e) => setF({ ...f, subject: e.target.value })} />
      <TextArea label={t('complaint.description')} value={f.description} error={errors.description} maxLength={2000} required onChange={(e) => setF({ ...f, description: e.target.value })} />
      <Button type="submit" loading={busy}>
        {t('complaint.submit')}
      </Button>
    </form>
  );
}

export default function GrievancePage() {
  const { t, tk, formatDate } = useI18n();
  const { user, loading: sessionLoading } = useSession();
  const [notice, setNotice] = useState<string | null>(null);
  const { data, loading, reload } = useLoad(() => (user ? api.get<{ complaints: Complaint[] }>('/api/complaints').then((r) => r.complaints) : Promise.resolve([])), [user?.id]);

  return (
    <div className="container-page py-8">
      <PageHeader title={t('griev.title')} subtitle={t('griev.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {sessionLoading ? (
            <Spinner />
          ) : !user ? (
            <EmptyState icon={LifeBuoy} title={t('griev.loginRequired')} action={<LinkButton href="/login?next=/grievance">{t('nav.login')}</LinkButton>} />
          ) : (
            <>
              <Section title={t('griev.new')}>
                {notice && <Alert tone="success" className="mb-4" onClose={() => setNotice(null)}>{notice}</Alert>}
                <ComplaintForm
                  onCreated={(ticket) => {
                    setNotice(t('complaint.sent', { ticket }));
                    reload();
                  }}
                />
              </Section>
              <Section title={t('griev.mine')}>
                {loading ? (
                  <Spinner />
                ) : !data?.length ? (
                  <p className="text-stone-700">{t('griev.empty')}</p>
                ) : (
                  <ul className="divide-y divide-stone-200">
                    {data.map((c) => (
                      <li key={c.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-stone-900">
                            {c.ticketNumber} · {c.subject}
                          </p>
                          <Badge tone={c.status === 'resolved' ? 'green' : c.status === 'dismissed' ? 'neutral' : 'amber'}>{tk('complaint.status', c.status)}</Badge>
                        </div>
                        <p className="text-sm text-stone-600">
                          {t(`complaint.cat.${c.category}` as MessageKey)} · {formatDate(c.createdAt)}
                        </p>
                        {c.resolutionNotes && <p className="mt-1 text-sm text-stone-800">{c.resolutionNotes}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>
        <aside className="space-y-4">
          <Section>
            <p className="flex items-center gap-2 font-semibold text-stone-900">
              <PhoneCall className="h-4 w-4" aria-hidden />
              {t('griev.emergency')}
            </p>
          </Section>
          <Section title={t('griev.officer')}>
            <p className="text-sm text-stone-700">{t('griev.officerText')}</p>
          </Section>
        </aside>
      </div>
    </div>
  );
}
