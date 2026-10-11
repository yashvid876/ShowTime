import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { listDisputes } from '@/api/admin.api';
import { qk } from '@/api/queryKeys';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RecordTable } from '@/components/admin/RecordTable';
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton, TextField } from '@/components/ui';

const LIMIT = 20;

export default function DisputesPage() {
  useDocumentTitle('Disputes');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const params = { status: status.trim(), page, limit: LIMIT };
  const q = useQuery({ queryKey: qk.adminDisputes(params), queryFn: () => listDisputes(params), placeholderData: (p) => p });
  return (
    <>
      <PageHeader title="Disputes" description="Payment and booking disputes that need review." />
      <TextField label="Filter by status" className="mb-5 max-w-xs" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="e.g. open" />
      {q.isLoading && <Skeleton className="h-48" />}
      {q.isError && <ErrorState error={q.error} onRetry={q.refetch} title="Couldn't load disputes" />}
      {q.data?.items.length === 0 && <EmptyState icon={ShieldAlert} title="No disputes">{status ? 'Nothing matches that status.' : 'There are no disputes to review.'}</EmptyState>}
      {q.data?.items.length > 0 && <RecordTable items={q.data.items} caption="Disputes" />}
      {q.data && <Pagination page={page} total={q.data.total ?? q.data.items.length} limit={q.data.limit || LIMIT} onChange={setPage} />}
    </>
  );
}
