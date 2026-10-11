import { AlertTriangle, CheckCircle2, Info, Inbox, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ label = 'Loading', className = '' }) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-ink-500 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />;
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-300 bg-white px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-danger-600/20 bg-danger-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-danger-600" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-danger-700">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-700">{error?.message || 'Something went wrong. Try again.'}</p>
      {error?.requestId && <p className="mt-1 text-xs text-ink-500">Reference: {error.requestId}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}

const alertTones = {
  info: ['border-ink-200 bg-white text-ink-800', Info, 'text-ink-500'],
  success: ['border-ok-600/25 bg-ok-50 text-ink-900', CheckCircle2, 'text-ok-600'],
  warn: ['border-warn-600/25 bg-warn-50 text-ink-900', AlertTriangle, 'text-warn-600'],
  error: ['border-danger-600/25 bg-danger-50 text-ink-900', XCircle, 'text-danger-600'],
};
export function Alert({ tone = 'info', title, children, className = '' }) {
  const [cls, Icon, iconCls] = alertTones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-lg border p-3.5 text-sm ${cls} ${className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconCls}`} aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-ink-700' : ''}>{children}</div>}
      </div>
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-ink-100 text-ink-700',
  ok: 'bg-ok-50 text-ok-700',
  warn: 'bg-warn-50 text-warn-600',
  danger: 'bg-danger-50 text-danger-700',
  brand: 'bg-brand-50 text-brand-700',
};
export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]} ${className}`}>{children}</span>;
}
