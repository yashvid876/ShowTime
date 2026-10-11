import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarX, Clock, Globe2, Star } from 'lucide-react';
import { getTitle } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Badge, EmptyState, ErrorState, Poster, Skeleton } from '@/components/ui';
import { ShowtimesByVenue } from '@/components/catalog/Showtimes';
import { ReviewsSection } from '@/components/catalog/Reviews';
import { buildDateStrip, formatDuration } from '@/utils/format';

const dates = buildDateStrip(7);

function DateStrip({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Show date" className="flex gap-2 overflow-x-auto pb-1">
      {dates.map((d) => {
        const on = d.key === value;
        return (
          <button key={d.key} type="button" role="radio" aria-checked={on} onClick={() => onChange(d.key)} className={`flex min-w-[4.5rem] flex-col items-center rounded-lg border px-3 py-2 transition-colors ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white hover:border-brand-600'}`}>
            <span className="text-xs font-medium">{d.weekday}</span>
            <span className="font-display text-xl font-bold leading-tight">{d.day}</span>
            <span className="text-xs">{d.month}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function TitleDetailPage({ kind }) {
  const { id } = useParams();
  const city = useUiStore((s) => s.city);
  const [date, setDate] = useState(dates[0].key);
  const params = { city, date };
  const q = useQuery({ queryKey: qk.title(kind, id, params), queryFn: () => getTitle(kind, id, params), placeholderData: (p) => p });
  const t = q.data?.movie || q.data?.event;
  useDocumentTitle(t?.title);

  if (q.isLoading) return <div className="container-page py-8"><div className="flex gap-6"><Skeleton className="hidden aspect-[2/3] w-56 sm:block" /><div className="flex-1 space-y-3"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-24 w-full" /></div></div></div>;
  if (q.isError) return <div className="container-page py-8"><ErrorState error={q.error} onRetry={q.refetch} title={q.error.status === 404 ? 'We could not find that title' : "Couldn't load this title"} /></div>;

  const people = t.cast || t.lineup || [];
  const venues = q.data.showsByVenue || [];
  return (
    <>
      <section className="bg-ink-900 text-white">
        <div className="container-page flex flex-col gap-6 py-8 sm:flex-row sm:py-10">
          <Poster src={t.posterUrl} title={t.title} className="aspect-[2/3] w-40 shrink-0 self-start rounded-xl shadow-pop sm:w-52" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{t.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-200">
              {t.avgRating > 0 && <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden="true" /><b className="text-white">{Number(t.avgRating).toFixed(1)}</b>/5</span>}
              {t.duration > 0 && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{formatDuration(t.duration)}</span>}
              {(t.language || []).length > 0 && <span className="inline-flex items-center gap-1.5"><Globe2 className="h-4 w-4" aria-hidden="true" />{t.language.join(', ')}</span>}
              {t.rating && <Badge className="!bg-white/15 !text-white">{t.rating}</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(t.genre || []).map((g) => <Badge key={g} className="!bg-white/10 !text-ink-100">{g}</Badge>)}
              {(t.format || []).map((f) => <Badge key={f} className="!bg-gold-400 !text-ink-900">{f}</Badge>)}
            </div>
            {t.synopsis && <p className="mt-5 max-w-2xl leading-relaxed text-ink-100">{t.synopsis}</p>}
            {people.length > 0 && <p className="mt-4 max-w-2xl text-sm text-ink-300"><span className="font-semibold text-ink-100">{t.cast ? 'Cast' : 'Line-up'}: </span>{people.join(', ')}</p>}
          </div>
        </div>
      </section>

      <div className="container-page py-8">
        <h2 className="mb-1 text-xl font-bold sm:text-2xl">Showtimes{city ? ` in ${city}` : ''}</h2>
        <p className="mb-4 text-sm text-ink-500">Choose a date, then a show to see the seat map.</p>
        <DateStrip value={date} onChange={setDate} />
        <div className={`mt-5 transition-opacity ${q.isFetching ? 'opacity-60' : ''}`}>
          {venues.length === 0
            ? <EmptyState icon={CalendarX} title="No shows on this date">Try another date{city ? ` or look beyond ${city}` : ''}.</EmptyState>
            : <ShowtimesByVenue venues={venues} />}
        </div>
        <ReviewsSection kind={kind} titleId={id} />
      </div>
    </>
  );
}
