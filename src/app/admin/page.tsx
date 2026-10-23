'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { Alert, Badge, Button, Checkbox, EmptyState, LoadError, Modal, PageHeader, RequireRole, SelectField, Spinner, Tabs, TextArea, TextField, useApiError, useLoad } from '@/components/ui';
import { BookingStatusBadge } from '@/components/domain';
import { useSystemText } from '@/components/ChatPanel';

type Tab = 'overview' | 'verification' | 'complaints' | 'reports' | 'bookings' | 'categories' | 'users' | 'audit';

// ---------------------------------------------------------------------------
function Overview() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ overview: Record<string, number> }>('/api/admin/overview').then((r) => r.overview), []);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  const items: [string, MessageKey][] = [
    ['pending_checks', 'admin.kpi.pendingChecks'],
    ['open_complaints', 'admin.kpi.openComplaints'],
    ['open_reports', 'admin.kpi.openReports'],
    ['safeguarding_holds', 'admin.kpi.holds'],
    ['workers', 'admin.kpi.workers'],
    ['customers', 'admin.kpi.customers'],
    ['employers', 'admin.kpi.employers'],
    ['bookings', 'admin.kpi.bookings'],
    ['completed', 'admin.kpi.completed'],
    ['cancelled', 'admin.kpi.cancelled'],
    ['open_requests', 'admin.kpi.openRequests'],
    ['open_jobs', 'admin.kpi.openJobs'],
    ['applications', 'admin.kpi.applications'],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(([k, label]) => (
        <div key={k} className="card p-4">
          <dt className="text-sm text-stone-600">{t(label)}</dt>
          <dd className="mt-1 text-2xl font-bold text-stone-900">{data[k] ?? 0}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
interface CheckRow {
  id: string;
  type: string;
  slot: number;
  status: string;
  consentGivenAt: string | null;
  submittedAt: string | null;
  workerId: string;
  workerName: string;
  category: string;
  locality: string;
  workerNote: string | null;
  reference: { name: string; relation: string; phone: string } | null;
  requiredForCategory: boolean;
  validMonths: number | null;
}

function DecideDialog({ check, methods, onClose, onDone }: { check: CheckRow | null; methods: string[]; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const errorText = useApiError();
  const [outcome, setOutcome] = useState<'passed' | 'failed'>('passed');
  const [method, setMethod] = useState(methods[0] || '');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});
  if (!check) return null;
  return (
    <Modal open onClose={onClose} title={`${t('admin.decide')}: ${t(`check.${check.type}` as MessageKey)}`}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setState({ busy: true });
          try {
            await api.post(`/api/admin/checks/${check.id}`, { outcome, method, notes: notes.trim(), expiresAt: expiresAt || null });
            onDone();
          } catch (err) {
            setState({ error: errorText(err) });
          }
        }}
      >
        <Alert tone="warning">{t('admin.providerNote')}</Alert>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <SelectField label={t('admin.outcome')} value={outcome} onChange={(e) => setOutcome(e.target.value as 'passed')}>
          <option value="passed">{t('admin.passed')}</option>
          <option value="failed">{t('admin.failed')}</option>
        </SelectField>
        <SelectField label={t('admin.method')} value={method} onChange={(e) => setMethod(e.target.value)}>
          {methods.map((m) => <option key={m} value={m}>{t(`admin.method.${m}` as MessageKey)}</option>)}
        </SelectField>
        <TextArea label={t('admin.notes')} value={notes} required minLength={5} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
        {outcome === 'passed' && (
          <TextField
            label={t('admin.expiresAt')}
            type="date"
            value={expiresAt}
            required={!!check.validMonths}
            optional={!check.validMonths}
            hint={check.validMonths ? t('admin.expiryRequired', { n: check.validMonths }) : undefined}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" loading={state.busy}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Verification() {
  const { t, tk, formatDateTime } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ checks: CheckRow[]; methods: string[] }>('/api/admin/checks'), []);
  const [deciding, setDeciding] = useState<CheckRow | null>(null);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  return (
    <>
      <Alert tone="info" className="mb-4">{t('admin.providerNote')}</Alert>
      {data.checks.length === 0 ? (
        <EmptyState title={t('admin.noPending')} />
      ) : (
        <ul className="space-y-3">
          {data.checks.map((c) => (
            <li key={c.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">
                    {tk('check', c.type)} {c.slot > 1 && `#${c.slot}`} — <Link href={`/workers/${c.workerId}`} className="link">{c.workerName}</Link>
                  </p>
                  <p className="text-sm text-stone-700">{tk('cat', c.category)} · {c.locality}</p>
                  {c.consentGivenAt && <p className="text-sm text-stone-600">{t('admin.consentGiven', { date: formatDateTime(c.consentGivenAt) })}</p>}
                </div>
                {c.requiredForCategory && <Badge tone="orange">{t('admin.required')}</Badge>}
              </div>
              {c.reference && (
                <p className="mt-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-800">
                  {c.reference.name} · {c.reference.relation} · {c.reference.phone}
                </p>
              )}
              {c.workerNote && <p className="mt-2 text-sm text-stone-800">“{c.workerNote}”</p>}
              <Button className="mt-3" onClick={() => setDeciding(c)}>{t('admin.decide')}</Button>
            </li>
          ))}
        </ul>
      )}
      <DecideDialog check={deciding} methods={data.methods} onClose={() => setDeciding(null)} onDone={() => { setDeciding(null); reload(); }} />
    </>
  );
}

// ---------------------------------------------------------------------------
interface ComplaintRow {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  bookingId: string | null;
  raisedByName: string;
  accusedName: string | null;
  safeguardingHold: boolean;
}

function ComplaintItem({ c, onDone }: { c: ComplaintRow; onDone: () => void }) {
  const { t, tk, formatDateTime } = useI18n();
  const errorText = useApiError();
  const [notes, setNotes] = useState('');
  const [lift, setLift] = useState(false);
  const [state, setState] = useState<{ busy?: string; error?: string }>({});
  const open = ['open', 'under_investigation'].includes(c.status);
  const update = async (status: string) => {
    if (notes.trim().length < 5) return setState({ error: t('validation.too_short') });
    setState({ busy: status });
    try {
      await api.post(`/api/admin/complaints/${c.id}`, { status, notes: notes.trim(), liftSafeguardingHold: lift || undefined });
      onDone();
    } catch (e) {
      setState({ error: errorText(e) });
    }
  };
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-stone-900">{c.ticketNumber} · {c.subject}</p>
          <p className="text-sm text-stone-700">
            {tk('complaint.cat', c.category)} · {t('admin.raisedBy', { name: c.raisedByName })}
            {c.accusedName && ` · ${t('admin.against', { name: c.accusedName })}`}
          </p>
          <p className="text-xs text-stone-500">{formatDateTime(c.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={open ? 'amber' : 'neutral'}>{tk('complaint.status', c.status)}</Badge>
          {c.safeguardingHold && <Badge tone="red">{t('admin.onHold')}</Badge>}
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-800">{c.description}</p>
      {c.bookingId && <Link href={`/bookings/${c.bookingId}`} className="link text-sm">{t('booking.open')}</Link>}
      {c.resolutionNotes && <p className="mt-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-800">{c.resolutionNotes}</p>}
      {open && (
        <div className="mt-3 space-y-3 border-t border-stone-200 pt-3">
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <TextArea label={t('admin.notes')} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} rows={2} />
          {c.safeguardingHold && <Checkbox label={t('admin.liftHold')} checked={lift} onChange={(e) => setLift(e.target.checked)} />}
          <div className="flex flex-wrap gap-2">
            {c.status === 'open' && <Button variant="secondary" loading={state.busy === 'under_investigation'} onClick={() => update('under_investigation')}>{t('admin.investigate')}</Button>}
            <Button loading={state.busy === 'resolved'} onClick={() => update('resolved')}>{t('admin.resolve')}</Button>
            <Button variant="ghost" loading={state.busy === 'dismissed'} onClick={() => update('dismissed')}>{t('admin.dismiss')}</Button>
          </div>
        </div>
      )}
    </li>
  );
}

function Complaints() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ complaints: ComplaintRow[] }>('/api/admin/complaints').then((r) => r.complaints), []);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState title={t('admin.noPending')} />;
  return <ul className="space-y-3">{data.map((c) => <ComplaintItem key={c.id} c={c} onDone={reload} />)}</ul>;
}

// ---------------------------------------------------------------------------
interface ReportFull {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  reporterName: string;
  reportedName: string;
  reportedSuspended: boolean;
  messages: { id: string; senderName: string | null; kind: 'text' | 'system' | 'offer'; body: string; params: any; createdAt: string; isReported: boolean }[];
}

function ReportReview({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const { t, tk, formatDateTime } = useI18n();
  const sysText = useSystemText();
  const errorText = useApiError();
  const { data, error, loading } = useLoad(() => api.get<{ report: ReportFull }>(`/api/admin/reports/${id}`).then((r) => r.report), [id]);
  const [notes, setNotes] = useState('');
  const [suspend, setSuspend] = useState(false);
  const [state, setState] = useState<{ busy?: string; error?: string }>({});
  const update = async (status: string) => {
    if (notes.trim().length < 3) return setState({ error: t('validation.too_short') });
    setState({ busy: status });
    try {
      await api.post(`/api/admin/reports/${id}`, { status, notes: notes.trim(), suspendUser: suspend || undefined });
      onDone();
    } catch (e) {
      setState({ error: errorText(e) });
    }
  };
  return (
    <Modal open onClose={onClose} title={t('admin.viewReport')}>
      {loading && <Spinner />}
      {!!error && <LoadError error={error} />}
      {data && (
        <div className="space-y-4">
          <Alert tone="info">{t('admin.auditViewNote')}</Alert>
          <p className="text-sm text-stone-800">
            <strong>{tk('chat.reason', data.reason)}</strong> — {t('admin.raisedBy', { name: data.reporterName })}, {t('admin.against', { name: data.reportedName })}
          </p>
          {data.details && <p className="text-sm text-stone-800">“{data.details}”</p>}
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-2 text-sm">
            {data.messages.map((m) => (
              <li key={m.id} className={m.isReported ? 'rounded bg-red-50 p-1' : 'p-1'}>
                {m.isReported && <span className="mr-1 font-semibold text-red-800">[{t('admin.reportedMessage')}]</span>}
                <span className="font-semibold">{m.senderName || '—'}:</span> {sysText(m)} <span className="text-xs text-stone-500">{formatDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <TextArea label={t('admin.notes')} value={notes} rows={2} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
          {!data.reportedSuspended && <Checkbox label={t('admin.suspendUser')} checked={suspend} onChange={(e) => setSuspend(e.target.checked)} />}
          <div className="flex flex-wrap gap-2">
            <Button loading={state.busy === 'actioned'} onClick={() => update('actioned')}>{t('admin.resolve')}</Button>
            <Button variant="secondary" loading={state.busy === 'dismissed'} onClick={() => update('dismissed')}>{t('admin.dismiss')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Reports() {
  const { t, tk, formatDateTime } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ reports: { id: string; reason: string; status: string; createdAt: string; reporterName: string; reportedName: string }[] }>('/api/admin/reports').then((r) => r.reports), []);
  const [open, setOpen] = useState<string | null>(null);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState title={t('admin.noPending')} />;
  return (
    <>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-semibold text-stone-900">{tk('chat.reason', r.reason)} · {t('admin.against', { name: r.reportedName })}</p>
              <p className="text-sm text-stone-600">{t('admin.raisedBy', { name: r.reporterName })} · {formatDateTime(r.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={['open', 'reviewing'].includes(r.status) ? 'amber' : 'neutral'}>{tk('report.status', r.status)}</Badge>
              <Button variant="secondary" onClick={() => setOpen(r.id)}>{t('admin.viewReport')}</Button>
            </div>
          </li>
        ))}
      </ul>
      {open && <ReportReview id={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); }} />}
    </>
  );
}

// ---------------------------------------------------------------------------
function Bookings() {
  const { formatDateTime, formatMoney } = useI18n();
  const { data, error, loading, reload } = useLoad(
    () => api.get<{ bookings: { id: string; bookingNumber: string; status: string; serviceTitle: string; startsAt: string; agreedPrice: number | null; locality: string; workerName: string; customerName: string }[] }>('/api/admin/bookings').then((r) => r.bookings),
    [],
  );
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
      {data.map((b) => (
        <li key={b.id}>
          <Link href={`/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-stone-50">
            <span>
              <span className="block font-semibold text-stone-900">{b.bookingNumber} · {b.serviceTitle}</span>
              <span className="block text-sm text-stone-600">
                {b.customerName} → {b.workerName} · {b.locality} · {formatDateTime(b.startsAt)}
                {b.agreedPrice !== null && ` · ${formatMoney(b.agreedPrice)}`}
              </span>
            </span>
            <BookingStatusBadge status={b.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Categories() {
  const { t, tk } = useI18n();
  const errorText = useApiError();
  const { data, error, loading, reload } = useLoad(() => api.get<{ categories: { slug: string; isEnabled: boolean; disabledReason: string | null }[] }>('/api/categories?all=1').then((r) => r.categories), []);
  const [err, setErr] = useState<string | null>(null);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  const toggle = async (slug: string, enabled: boolean) => {
    const reason = enabled ? undefined : window.prompt(t('admin.reasonPrompt')) || undefined;
    if (!enabled && reason === undefined) return;
    try {
      await api.post(`/api/admin/categories/${slug}`, { enabled, reason });
      reload();
    } catch (e) {
      setErr(errorText(e));
    }
  };
  return (
    <>
      {err && <Alert tone="error" className="mb-3">{err}</Alert>}
      <Alert tone="info" className="mb-3">{t('admin.childcareNote')}</Alert>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {data.map((c) => (
          <li key={c.slug} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <span>
              <span className="block font-semibold text-stone-900">{tk('cat', c.slug)}</span>
              {c.disabledReason && <span className="block text-sm text-stone-600">{c.disabledReason}</span>}
            </span>
            <span className="flex items-center gap-2">
              <Badge tone={c.isEnabled ? 'green' : 'neutral'}>{c.isEnabled ? t('admin.enabled') : t('admin.disabled')}</Badge>
              <Button variant="secondary" onClick={() => toggle(c.slug, !c.isEnabled)}>{c.isEnabled ? t('admin.disable') : t('admin.enable')}</Button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Users() {
  const { t, tk, formatDate } = useI18n();
  const errorText = useApiError();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, loading, reload } = useLoad(
    () => api.get<{ users: { id: string; name: string; role: string; locality: string; suspended: boolean; workerId: string | null; safeguardingHold: boolean; joinedAt: string }[] }>(`/api/admin/users${search ? `?q=${encodeURIComponent(search)}` : ''}`).then((r) => r.users),
    [search],
  );
  const [err, setErr] = useState<string | null>(null);
  const [temp, setTemp] = useState<string | null>(null);
  const resetPassword = async (id: string, name: string) => {
    const reason = window.prompt(t('admin.reasonPrompt'));
    if (!reason || reason.trim().length < 3) return;
    try {
      const r = await api.post<{ temporaryPassword: string }>(`/api/admin/users/${id}/reset-password`, { reason: reason.trim() });
      setTemp(t('admin.tempPassword', { name, password: r.temporaryPassword }));
    } catch (e) {
      setErr(errorText(e));
    }
  };
  const setSuspended = async (id: string, suspended: boolean) => {
    const reason = window.prompt(t('admin.reasonPrompt'));
    if (!reason || reason.trim().length < 3) return;
    try {
      await api.post(`/api/admin/users/${id}`, { suspended, reason: reason.trim() });
      reload();
    } catch (e) {
      setErr(errorText(e));
    }
  };
  return (
    <>
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }}>
        <TextField label={t('admin.searchUsers')} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Button type="submit" className="self-end">{t('common.search')}</Button>
      </form>
      {err && <Alert tone="error" className="mb-3">{err}</Alert>}
      {temp && <Alert tone="warning" className="mb-3" onClose={() => setTemp(null)}>{temp}</Alert>}
      {loading ? <Spinner /> : error || !data ? <LoadError error={error} onRetry={reload} /> : (
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {data.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span>
                <span className="block font-semibold text-stone-900">
                  {u.workerId ? <Link href={`/workers/${u.workerId}`} className="link">{u.name}</Link> : u.name}
                </span>
                <span className="block text-sm text-stone-600">{tk('role', u.role)} · {u.locality} · {formatDate(u.joinedAt)}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {u.safeguardingHold && <Badge tone="red">{t('admin.onHold')}</Badge>}
                {u.suspended && <Badge tone="red">{t('admin.suspended')}</Badge>}
                {u.role !== 'admin' && <Button variant="secondary" onClick={() => resetPassword(u.id, u.name)}>{t('admin.resetPassword')}</Button>}
                {u.role !== 'admin' && (
                  <Button variant={u.suspended ? 'secondary' : 'danger'} onClick={() => setSuspended(u.id, !u.suspended)}>
                    {u.suspended ? t('admin.reinstate') : t('admin.suspend')}
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Audit() {
  const { formatDateTime } = useI18n();
  const { data, error, loading, reload } = useLoad(() => api.get<{ logs: { id: string; action: string; targetType: string; details: string; adminName: string; at: string }[] }>('/api/admin/audit').then((r) => r.logs), []);
  if (loading) return <Spinner />;
  if (error || !data) return <LoadError error={error} onRetry={reload} />;
  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white text-sm">
      {data.map((l) => (
        <li key={l.id} className="p-3">
          <p className="font-mono text-xs font-semibold text-stone-900">{l.action}</p>
          <p className="break-words text-stone-800">{l.details}</p>
          <p className="text-xs text-stone-500">{l.adminName} · {formatDateTime(l.at)}</p>
        </li>
      ))}
    </ul>
  );
}

function Console() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('overview');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('admin.overview') },
    { id: 'verification', label: t('admin.verification') },
    { id: 'complaints', label: t('admin.complaints') },
    { id: 'reports', label: t('admin.reports') },
    { id: 'bookings', label: t('admin.bookings') },
    { id: 'categories', label: t('admin.categories') },
    { id: 'users', label: t('admin.users') },
    { id: 'audit', label: t('admin.audit') },
  ];
  return (
    <div className="container-page py-8">
      <PageHeader title={t('admin.title')} />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'overview' && <Overview />}
      {tab === 'verification' && <Verification />}
      {tab === 'complaints' && <Complaints />}
      {tab === 'reports' && <Reports />}
      {tab === 'bookings' && <Bookings />}
      {tab === 'categories' && <Categories />}
      {tab === 'users' && <Users />}
      {tab === 'audit' && <Audit />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireRole roles={['admin']}>
      <Console />
    </RequireRole>
  );
}
