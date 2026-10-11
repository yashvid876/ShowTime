import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Poster, Skeleton } from '@/components/ui';
import { formatDuration } from '@/utils/format';

export function TitleCard({ item, kind }) {
  const type = item.type || kind || 'movie';
  const meta = [(item.genre || []).slice(0, 2).join(', '), formatDuration(item.duration)].filter(Boolean);
  return (
    <Link to={`/${type}s/${item.id}`} className="group block rounded-xl">
      <div className="relative overflow-hidden rounded-xl bg-ink-100 shadow-card">
        <Poster src={item.posterUrl} title={item.title} className="aspect-[2/3] w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        {item.rating && <span className="absolute left-2 top-2 rounded-md bg-ink-900/80 px-1.5 py-0.5 text-[11px] font-bold text-white">{item.rating}</span>}
        {type === 'event' && <span className="absolute right-2 top-2 rounded-md bg-gold-400 px-1.5 py-0.5 text-[11px] font-bold text-ink-900">Live</span>}
      </div>
      <h3 className="mt-2.5 line-clamp-2 font-display text-base font-semibold leading-tight group-hover:text-brand-700">{item.title}</h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{meta.join(' • ')}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
        {item.avgRating ? (<><Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" aria-hidden="true" /><span className="font-semibold">{Number(item.avgRating).toFixed(1)}</span></>) : <span className="text-ink-400">No ratings yet</span>}
        {(item.language || []).length > 0 && <span className="text-ink-400">{item.language.slice(0, 2).join(', ')}</span>}
      </div>
    </Link>
  );
}

export function TitleGrid({ items = [], kind }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((it) => <li key={`${it.type || kind}-${it.id}`}><TitleCard item={it} kind={kind} /></li>)}
    </ul>
  );
}

export function TitleGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}><Skeleton className="aspect-[2/3] w-full" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-3 w-1/2" /></div>
      ))}
    </div>
  );
}
