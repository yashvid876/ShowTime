import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clapperboard, Pencil, Plus } from 'lucide-react';
import { listTitles } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { EmptyState, ErrorState, LinkButton, PageHeader, Pagination, Poster, Skeleton, Tabs, TextField } from '@/components/ui';
import { formatDuration } from '@/utils/format';

const LIMIT = 12;

export default function CatalogPage() {
  useDocumentTitle('Movies & events');
  const [kind, setKind] = useState('movie');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(text);
  const params = { q, page, limit: LIMIT };
  const query = useQuery({ queryKey: qk.titles(kind, { ...params, admin: true }), queryFn: () => listTitles(kind, params), placeholderData: (p) => p });
  return (
    <>
      <PageHeader title="Movies & events" description="Add titles to the catalog and keep their details current." actions={<LinkButton to={`/admin/catalog/new?type=${kind}`}><Plus className="h-4 w-4" aria-hidden="true" /> Add {kind}</LinkButton>} />
      <Tabs label="Content type" value={kind} onChange={(v) => { setKind(v); setPage(1); }} tabs={[{ value: 'movie', label: 'Movies' }, { value: 'event', label: 'Events' }]} />
      <TextField className="mt-4 max-w-sm" label="Search by title" type="search" value={text} onChange={(e) => { setText(e.target.value); setPage(1); }} />
      <div className="mt-5">
        {query.isLoading && <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
        {query.isError && <ErrorState error={query.error} onRetry={query.refetch} />}
        {query.data?.items.length === 0 && <EmptyState icon={Clapperboard} title={`No ${kind}s found`} action={<LinkButton to={`/admin/catalog/new?type=${kind}`}>Add {kind}</LinkButton>}>{q ? 'Try a different search.' : 'The catalog is empty.'}</EmptyState>}
        <ul className={`space-y-2 transition-opacity ${query.isPlaceholderData ? 'opacity-50' : ''}`} aria-busy={query.isPlaceholderData}>
          {query.data?.items.map((t) => (
            <li key={t.id} className="card flex items-center gap-4 p-3">
              <Poster src={t.posterUrl} title={t.title} className="h-20 w-14 shrink-0 rounded-md text-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{t.title}</p>
                <p className="truncate text-sm text-ink-500">{[(t.genre || []).join(', '), (t.language || []).join(', '), formatDuration(t.duration)].filter(Boolean).join(' • ')}</p>
              </div>
              <Link to={`/admin/catalog/${t.id}/edit?type=${kind}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-300 px-3 text-sm font-semibold hover:bg-ink-50"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit</Link>
            </li>
          ))}
        </ul>
        {query.data && <Pagination page={page} total={query.data.total} limit={LIMIT} onChange={setPage} />}
      </div>
    </>
  );
}
