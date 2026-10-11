import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileClock } from 'lucide-react';
import { listAuditLog } from '@/api/admin.api';
import { qk } from '@/api/queryKeys';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RecordTable } from '@/components/admin/RecordTable';
import { EmptyState, ErrorState, PageHeader, Skeleton, TextField } from '@/components/ui';

export default function AuditLogPage() {
  useDocumentTitle('Audit log');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const bad = from && to && from > to;
  const params = { actorId: actorId.trim(), from: from && !bad ? new Date(`${from}T00:00:00`).toISOString() : '', to: to && !bad ? new Date(`${to}T23:59:59.999`).toISOString() : '' };
  const q = useQuery({ queryKey: qk.adminAudit(params), queryFn: () => listAuditLog(params), placeholderData: (p) => p });
  return (
    <>
      <PageHeader title="Audit log" description="Who changed what, across venues, shows and partner accounts." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <TextField label="Actor ID" value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="Filter by user" />
        <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} error={bad ? 'End must be after start' : undefined} />
      </div>
      {q.isLoading && <Skeleton className="h-48" />}
      {q.isError && <ErrorState error={q.error} onRetry={q.refetch} title="Couldn't load the audit log" />}
      {q.data?.items.length === 0 && <EmptyState icon={FileClock} title="No entries">Nothing matches these filters.</EmptyState>}
      {q.data?.items.length > 0 && <RecordTable items={q.data.items} caption="Audit log" />}
    </>
  );
}
