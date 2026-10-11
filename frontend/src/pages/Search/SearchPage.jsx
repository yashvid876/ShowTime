import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchX, X } from 'lucide-react';
import { listTitles } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { TitleGrid, TitleGridSkeleton } from '@/components/catalog/TitleCard';
import { Button, EmptyState, ErrorState, Pagination, SelectField, Tabs, TextField } from '@/components/ui';
import { FORMATS, GENRES, LANGUAGES } from '@/utils/constants';
import { pluralize, toDateParam } from '@/utils/format';

const LIMIT = 20;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const city = useUiStore((s) => s.city);
  const kind = params.get('type') === 'event' ? 'event' : 'movie';
  const page = Number(params.get('page')) || 1;
  const filters = { q: params.get('q') || '', genre: params.get('genre') || '', language: params.get('language') || '', date: params.get('date') || '', format: params.get('format') || '' };
  useDocumentTitle(kind === 'event' ? 'Events' : 'Movies');

  const [text, setText] = useState(filters.q);
  const debounced = useDebounce(text);
  useEffect(() => { setText(filters.q); }, [filters.q]);

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if (debounced !== filters.q) update({ q: debounced });
    // Only react to the debounced text; `update`/`filters.q` change on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = { city, ...filters, page, limit: LIMIT };
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({ queryKey: qk.titles(kind, query), queryFn: () => listTitles(kind, query), placeholderData: (p) => p });
  const active = ['genre', 'language', 'date', 'format'].some((k) => filters[k]) || filters.q;

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{kind === 'event' ? 'Live events' : 'Movies'}{city ? ` in ${city}` : ''}</h1>
      <Tabs className="mt-4" label="Content type" value={kind} onChange={(v) => update({ type: v === 'movie' ? '' : v })} tabs={[{ value: 'movie', label: 'Movies' }, { value: 'event', label: 'Events' }]} />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="card mt-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <TextField label="Search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Title" className="lg:col-span-1" />
        <SelectField label="Genre" value={filters.genre} onChange={(e) => update({ genre: e.target.value })}>
          <option value="">All genres</option>{GENRES.map((g) => <option key={g}>{g}</option>)}
        </SelectField>
        <SelectField label="Language" value={filters.language} onChange={(e) => update({ language: e.target.value })}>
          <option value="">All languages</option>{LANGUAGES.map((g) => <option key={g}>{g}</option>)}
        </SelectField>
        <TextField label="Date" type="date" min={toDateParam()} value={filters.date} onChange={(e) => update({ date: e.target.value })} />
        {kind === 'movie' ? (
          <SelectField label="Format" value={filters.format} onChange={(e) => update({ format: e.target.value })}>
            <option value="">Any format</option>{FORMATS.map((g) => <option key={g}>{g}</option>)}
          </SelectField>
        ) : <div />}
      </form>

      <div className="mt-4 flex min-h-8 items-center justify-between">
        <p className="text-sm text-ink-500" aria-live="polite">{data ? pluralize(data.total, 'result') : ''}</p>
        {active && <Button variant="ghost" size="sm" onClick={() => { setText(''); setParams(kind === 'event' ? { type: 'event' } : {}, { replace: true }); }}><X className="h-4 w-4" aria-hidden="true" /> Clear filters</Button>}
      </div>

      <div className={`mt-2 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
        {isLoading && <TitleGridSkeleton />}
        {isError && <ErrorState error={error} onRetry={refetch} />}
        {data && data.items.length === 0 && (
          <EmptyState icon={SearchX} title="No matches found" action={active ? <Button variant="secondary" onClick={() => { setText(''); setParams(kind === 'event' ? { type: 'event' } : {}, { replace: true }); }}>Clear filters</Button> : null}>
            Try a different title or loosen the filters.
          </EmptyState>
        )}
        {data && data.items.length > 0 && <TitleGrid items={data.items} kind={kind} />}
      </div>
      {data && <Pagination page={data.page || page} total={data.total} limit={data.limit || LIMIT} onChange={(p) => { update({ page: String(p) }, false); window.scrollTo({ top: 0 }); }} />}
    </div>
  );
}
