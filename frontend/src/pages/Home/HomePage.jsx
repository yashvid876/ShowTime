import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles } from 'lucide-react';
import { getRecommendations, listTitles } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { CityPicker } from '@/components/layout/CityModal';
import { TitleGrid, TitleGridSkeleton } from '@/components/catalog/TitleCard';
import { Button, EmptyState, ErrorState } from '@/components/ui';

function Section({ title, query, kind, seeAllTo, emptyText }) {
  const { isLoading, isError, error, data, refetch } = query;
  const items = data?.items || [];
  return (
    <section className="mt-12" aria-label={title}>
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {seeAllTo && <Link to={seeAllTo} className="text-sm font-semibold text-brand-700 hover:underline">See all</Link>}
      </div>
      {isLoading && <TitleGridSkeleton count={5} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !isError && items.length === 0 && <EmptyState title="Nothing here yet">{emptyText}</EmptyState>}
      {items.length > 0 && <TitleGrid items={items} kind={kind} />}
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle();
  const navigate = useNavigate();
  const city = useUiStore((s) => s.city);
  const setCity = useUiStore((s) => s.setCity);
  const authed = !!useAuthStore((s) => s.user);
  const [q, setQ] = useState('');

  const recs = useQuery({ queryKey: qk.recommendations(city, authed), queryFn: () => getRecommendations({ city }) });
  const movies = useQuery({ queryKey: qk.titles('movie', { city, limit: 10, home: true }), queryFn: () => listTitles('movie', { city, limit: 10 }) });
  const events = useQuery({ queryKey: qk.titles('event', { city, limit: 5, home: true }), queryFn: () => listTitles('event', { city, limit: 5 }) });

  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="container-page py-10 sm:py-14">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
            {city ? `What's on in ${city}` : 'Pick a film, pick your seat'}
          </h1>
          <p className="mt-3 max-w-xl text-brand-100">Browse showtimes, see the live seat map and book in a few taps.</p>
          <form role="search" className="mt-6 flex max-w-xl gap-2" onSubmit={(e) => { e.preventDefault(); navigate(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}>
            <div className="relative flex-1">
              <label htmlFor="hero-search" className="sr-only">Search movies and events</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input id="hero-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies, plays, concerts" className="h-12 w-full rounded-lg border-0 bg-white pl-10 pr-3 text-ink-900 placeholder:text-ink-400" />
            </div>
            <Button type="submit" variant="gold" size="lg">Search</Button>
          </form>
          {!city && (
            <div className="mt-8 max-w-xl rounded-xl bg-white p-4 text-ink-900">
              <p className="mb-3 text-sm font-semibold">Choose your city</p>
              <CityPicker onPick={setCity} />
            </div>
          )}
        </div>
      </section>

      <div className="container-page pb-4">
        {(recs.isLoading || (recs.data?.items?.length ?? 0) > 0 || recs.isError) && (
          <section className="mt-12" aria-label={authed ? 'Recommended for you' : 'Trending now'}>
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-600" aria-hidden="true" />
              <h2 className="text-xl font-bold sm:text-2xl">{authed ? 'Recommended for you' : 'Trending now'}</h2>
            </div>
            {recs.isLoading && <TitleGridSkeleton count={5} />}
            {recs.isError && <ErrorState error={recs.error} onRetry={recs.refetch} />}
            {recs.data?.items?.length > 0 && <TitleGrid items={recs.data.items.slice(0, 5)} />}
          </section>
        )}
        <Section title="Movies" query={movies} kind="movie" seeAllTo="/search?type=movie" emptyText={city ? `No movies are listed in ${city} right now.` : 'No movies are listed right now.'} />
        <Section title="Live events" query={events} kind="event" seeAllTo="/search?type=event" emptyText={city ? `No events are listed in ${city} right now.` : 'No events are listed right now.'} />
      </div>
    </>
  );
}
