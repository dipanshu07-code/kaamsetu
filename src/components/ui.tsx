'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiClientError } from '@/lib/api';
import { useI18n, MessageKey } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import type { UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 border border-brand-700',
  secondary: 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-50',
  ghost: 'bg-transparent text-stone-700 border border-transparent hover:bg-stone-100',
  danger: 'bg-white text-red-700 border border-red-300 hover:bg-red-50',
};
const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 min-h-[44px] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-center';

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button type={type} className={cn(base, variants[variant], className)} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = 'primary',
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Form fields (label, hint and error are always wired to the control)
// ---------------------------------------------------------------------------
interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

function useFieldIds(id?: string) {
  const auto = useId();
  const fid = id || auto;
  return { fid, hintId: `${fid}-hint`, errId: `${fid}-err` };
}

function FieldShell({
  fid,
  hintId,
  errId,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: FieldProps & { fid: string; hintId: string; errId: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fid} className="block text-sm font-semibold text-stone-800">
        {label}
        {required && <span className="sr-only"> ({t('common.required')})</span>}
        {optional && <span className="ml-1 font-normal text-stone-500">({t('common.optional')})</span>}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-sm text-stone-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-start gap-1.5 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(hint: unknown, error: unknown, hintId: string, errId: string) {
  return [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
}

export function TextField({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id,
  ...rest
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const { fid, hintId, errId } = useFieldIds(id);
  return (
    <FieldShell {...{ fid, hintId, errId, label, hint, error, required, optional, className }}>
      <input
        id={fid}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, hintId, errId)}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id,
  ...rest
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { fid, hintId, errId } = useFieldIds(id);
  return (
    <FieldShell {...{ fid, hintId, errId, label, hint, error, required, optional, className }}>
      <textarea
        id={fid}
        rows={4}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, hintId, errId)}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  optional,
  className,
  id,
  children,
  ...rest
}: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { fid, hintId, errId } = useFieldIds(id);
  return (
    <FieldShell {...{ fid, hintId, errId, label, hint, error, required, optional, className }}>
      <select
        id={fid}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, hintId, errId)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Checkbox({
  label,
  hint,
  className,
  ...rest
}: { label: React.ReactNode; hint?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input id={id} type="checkbox" className="mt-1 h-5 w-5 flex-none rounded border-stone-400 accent-brand-700" {...rest} />
      <label htmlFor={id} className="text-sm text-stone-800">
        {label}
        {hint && <span className="mt-0.5 block text-stone-600">{hint}</span>}
      </label>
    </div>
  );
}

/** Large, tappable radio cards for simple choices. */
export function ChoiceGroup<T extends string>({
  legend,
  value,
  onChange,
  options,
  columns = 1,
}: {
  legend: React.ReactNode;
  value: T | '';
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; hint?: React.ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-stone-800">{legend}</legend>
      <div className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3')}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 text-sm',
              value === o.value ? 'border-brand-700 ring-1 ring-brand-700' : 'border-stone-300 hover:border-stone-400',
            )}
          >
            <input type="radio" name={name} className="mt-0.5 h-4 w-4 accent-brand-700" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>
              <span className="font-semibold text-stone-900">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-stone-600">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
const alertStyles = {
  info: { box: 'border-stone-300 bg-stone-50 text-stone-800', Icon: Info },
  success: { box: 'border-green-300 bg-green-50 text-green-900', Icon: CheckCircle2 },
  warning: { box: 'border-amber-300 bg-amber-50 text-amber-900', Icon: TriangleAlert },
  error: { box: 'border-red-300 bg-red-50 text-red-900', Icon: AlertCircle },
};

export function Alert({
  tone = 'info',
  title,
  children,
  onClose,
  className,
}: {
  tone?: keyof typeof alertStyles;
  title?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const s = alertStyles[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border p-3 text-sm', s.box, className)}
    >
      <s.Icon className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/5" aria-label={t('common.close')}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-stone-600">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label || t('common.loading')}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  text?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card px-6 py-10 text-center">
      {Icon && <Icon className="mx-auto mb-3 h-8 w-8 text-stone-400" aria-hidden />}
      <p className="font-semibold text-stone-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-stone-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, children, actions, className }: { title?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={cn('card p-4 sm:p-5', className)}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-lg font-semibold text-stone-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const badgeTones = {
  neutral: 'bg-stone-100 text-stone-800 border-stone-300',
  orange: 'bg-brand-50 text-brand-900 border-brand-200',
  green: 'bg-green-50 text-green-900 border-green-300',
  amber: 'bg-amber-50 text-amber-900 border-amber-300',
  red: 'bg-red-50 text-red-900 border-red-300',
};

export function Badge({ tone = 'neutral', children, icon: Icon }: { tone?: keyof typeof badgeTones; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold', badgeTones[tone])}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tabs (accessible tablist)
// ---------------------------------------------------------------------------
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            '-mb-px min-h-[44px] whitespace-nowrap border-b-2 px-3 text-sm font-semibold',
            value === tab.id ? 'border-brand-700 text-stone-900' : 'border-transparent text-stone-600 hover:text-stone-900',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal dialog (focus moves in, Escape closes, focus returns)
// ---------------------------------------------------------------------------
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    (first || ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 sm:max-w-lg sm:rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-stone-900">
            {title}
          </h2>
          <button type="button" data-close onClick={onClose} className="rounded p-1.5 hover:bg-stone-100" aria-label={t('common.close')}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data loading and errors
// ---------------------------------------------------------------------------
export function useApiError() {
  const { t } = useI18n();
  return useCallback(
    (e: unknown) => {
      const code = e instanceof ApiClientError ? e.code : 'generic';
      const key = `errors.${code}` as MessageKey;
      return t(key) === key ? t('errors.generic') : t(key);
    },
    [t],
  );
}

/** Field-level messages from a validation error response. */
export function useFieldErrors() {
  const { t } = useI18n();
  return useCallback(
    (e: unknown): Record<string, string> => {
      if (!(e instanceof ApiClientError)) return {};
      const out: Record<string, string> = {};
      for (const [k, code] of Object.entries(e.fields || {})) {
        const key = `validation.${code}` as MessageKey;
        out[k] = t(key) === key ? t('validation.invalid') : t(key);
      }
      return out;
    },
    [t],
  );
}

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export function LoadError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = useApiError()(error);
  const { t } = useI18n();
  return (
    <Alert tone="error">
      <p>{msg}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="link mt-1">
          {t('common.retry')}
        </button>
      )}
    </Alert>
  );
}

/** Gate a page to signed-in users with one of the given roles. */
export function RequireRole({ roles, children }: { roles?: UserRole[]; children: React.ReactNode }) {
  const { user, loading } = useSession();
  const { t } = useI18n();
  const pathname = usePathname();
  if (loading) return <Spinner />;
  if (!user) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title={t('misc.loginRequired')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <LinkButton href={`/login?next=${encodeURIComponent(pathname)}`}>{t('nav.login')}</LinkButton>
              <LinkButton href="/signup" variant="secondary">{t('nav.signup')}</LinkButton>
            </div>
          }
        />
      </div>
    );
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container-page py-10">
        <EmptyState title={t('misc.wrongRole')} action={<LinkButton href="/" variant="secondary">{t('misc.goHome')}</LinkButton>} />
      </div>
    );
  }
  return <>{children}</>;
}
