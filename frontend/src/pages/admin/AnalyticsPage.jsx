import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { getAnalytics } from '@/api/admin.api';
import { qk } from '@/api/queryKeys';
import { useAdminVenues } from '@/features/auth/useAdminVenues';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BarChart } from '@/components/admin/BarChart';
import { EmptyState, ErrorState, PageHeader, SelectField, Skeleton, TextField } from '@/components/ui';
import { formatMoney, toDateParam } from '@/utils/format';

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toDateParam(d); };
const startOfDayIso = (s) => new Date(`${s}T00:00:00`).toISOString();
const endOfDayIso = (s) => new Date(`${s}T23:59:59.999`).toISOString();

function Kpi({ label, value, hint }) {
  return (
    <div className="card p-5"><dt className="text-sm text-ink-500">{label}</dt><dd className="mt-1 font-display text-3xl font-bold">{value}</dd>{hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}</div>
  );
}

export default function AnalyticsPage() {
  useDocumentTitle('Analytics');
  const [sp] = useSearchParams();
  const { venues, isLoading: venuesLoading } = useAdminVenues();
  const [venueId, setVenueId] = useState(sp.get('venueId') || '');
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(toDateParam());
  const [showId, setShowId] = useState('');
  const selected = venueId || venues[0]?.id || '';
  const rangeOk = from && to && from <= to;
  const params = { from: rangeOk ? startOfDayIso(from) : undefined, to: rangeOk ? endOfDayIso(to) : undefined, showId: /^[a-f0-9]{24}$/i.test(showId) ? showId : undefined };
  const q = useQuery({ queryKey: qk.adminAnalytics(selected, params), queryFn: () => getAnalytics(selected, params), enabled: !!selected && rangeOk });

  const series = useMemo(() => (q.data?.bookingsByDay || []).map((d) => {
    const key = d.date || d.day || d._id || '';
    return { key, label: key ? new Date(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '', value: Number(d.bookings ?? d.count ?? d.total ?? 0) };
  }), [q.data]);
  const totalBookings = series.reduce((n, d) => n + d.value, 0);
  const rate = q.data?.occupancyRate;
  const pct = rate == null ? '—' : `${(rate <= 1 ? rate * 100 : rate).toFixed(1)}%`;

  return (
    <>
      <PageHeader title="Analytics" description="Occupancy, revenue and booking trends for your venues." />
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField label="Venue" value={selected} onChange={(e) => setVenueId(e.target.value)} disabled={venuesLoading}>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </SelectField>
        <TextField label="From" type="date" max={to} value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField label="To" type="date" min={from} max={toDateParam()} value={to} onChange={(e) => setTo(e.target.value)} />
        <TextField label="Show ID (optional)" value={showId} onChange={(e) => setShowId(e.target.value.trim())} placeholder="Limit to one show" error={showId && !params.showId ? 'Show IDs are 24 characters' : undefined} />
      </div>
      {!rangeOk && <p role="alert" className="mt-3 text-sm font-medium text-danger-700">The start date must be on or before the end date.</p>}

      <div className="mt-5">
        {!venuesLoading && venues.length === 0 && <EmptyState icon={BarChart3} title="No venues to report on">Analytics appear once a venue is assigned to your account.</EmptyState>}
        {q.isLoading && <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}
        {q.isError && <ErrorState error={q.error} onRetry={q.refetch} title="Couldn't load analytics" />}
        {q.data && (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Kpi label="Occupancy rate" value={pct} hint="Seats sold vs capacity" />
              <Kpi label="Revenue" value={formatMoney(q.data.revenue)} />
              <Kpi label="Bookings" value={totalBookings.toLocaleString('en-IN')} hint="In the selected range" />
            </dl>
            <section className="card mt-4 p-5" aria-label="Bookings per day">
              <h2 className="mb-4 font-semibold">Bookings per day</h2>
              {series.length ? <BarChart data={series} /> : <p className="py-8 text-center text-sm text-ink-500">No bookings in this range.</p>}
            </section>
          </>
        )}
      </div>
    </>
  );
}
