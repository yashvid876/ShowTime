import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { AVAILABILITY } from '@/utils/constants';
import { formatMoney, formatTime } from '@/utils/format';

function ShowChip({ show }) {
  const av = AVAILABILITY[show.availability] || AVAILABILITY.AVAILABLE;
  const soldOut = show.availability === 'SOLD_OUT';
  const body = (
    <>
      <span className="text-base font-bold">{formatTime(show.startTime)}</span>
      <span className="mt-0.5 text-xs text-ink-500">{[show.format, show.screenName].filter(Boolean).join(', ')}</span>
      {show.priceFrom != null && <span className="mt-1 text-xs font-semibold text-ink-700">from {formatMoney(show.priceFrom)}</span>}
      <Badge tone={av.tone} className="mt-2 self-start">{av.label}</Badge>
    </>
  );
  const cls = 'flex min-w-[8.5rem] flex-col rounded-lg border px-3.5 py-3 text-left transition-colors';
  if (soldOut) return <div className={`${cls} border-ink-200 bg-ink-50 text-ink-400`} aria-disabled="true">{body}</div>;
  return <Link to={`/shows/${show.id}/seats`} className={`${cls} border-ink-300 bg-white hover:border-brand-600 hover:bg-brand-50`}>{body}</Link>;
}

export function ShowtimesByVenue({ venues = [] }) {
  return (
    <div className="space-y-4">
      {venues.map(({ venue, shows }) => (
        <section key={venue.id} className="card p-4 sm:p-5" aria-label={venue.name}>
          <h3 className="flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-brand-600" aria-hidden="true" />{venue.name}{venue.city && <span className="text-sm font-normal text-ink-500">{venue.city}</span>}</h3>
          <ul className="mt-4 flex flex-wrap gap-3">
            {shows.map((s) => <li key={s.id}><ShowChip show={s} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
