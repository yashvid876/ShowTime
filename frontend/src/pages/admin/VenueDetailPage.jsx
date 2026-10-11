import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Plus } from 'lucide-react';
import { useAdminVenues } from '@/features/auth/useAdminVenues';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, EmptyState, ErrorState, LinkButton, PageHeader, Skeleton, Tabs } from '@/components/ui';
import { ScreenBuilder } from './ScreenBuilder';
import { ScreenCard } from './ScreenCard';
import { RefundPolicyForm } from './RefundPolicyForm';

export default function VenueDetailPage() {
  const { venueId } = useParams();
  const { venues, isLoading, isError, error, refetch } = useAdminVenues();
  const venue = venues.find((v) => v.id === venueId);
  const [tab, setTab] = useState('screens');
  const [building, setBuilding] = useState(false);
  useDocumentTitle(venue?.name || 'Venue');

  if (isLoading) return <Skeleton className="h-64" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn't load this venue" />;
  if (!venue) return <EmptyState title="Venue not found" action={<LinkButton to="/admin">Back to venues</LinkButton>}>It may not be assigned to your account.</EmptyState>;

  const screens = venue.screens || [];
  return (
    <>
      <Link to="/admin" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All venues</Link>
      <PageHeader title={venue.name} description={[venue.city, venue.address].filter(Boolean).join(', ')} actions={<LinkButton variant="secondary" to={`/admin/analytics?venueId=${venue.id}`}><BarChart3 className="h-4 w-4" aria-hidden="true" /> Analytics</LinkButton>} />
      <Tabs label="Venue settings" value={tab} onChange={setTab} tabs={[{ value: 'screens', label: 'Screens & pricing' }, { value: 'refunds', label: 'Refund policy' }]} />
      <div className="mt-5 space-y-4">
        {tab === 'screens' && (
          <>
            {!building && <Button onClick={() => setBuilding(true)}><Plus className="h-4 w-4" aria-hidden="true" /> Add screen</Button>}
            {building && <ScreenBuilder venueId={venue.id} onCancel={() => setBuilding(false)} onCreated={() => setBuilding(false)} />}
            {screens.length === 0 && !building && <EmptyState title="No screens yet">Add a screen to define its seat map, then set prices for each category.</EmptyState>}
            {screens.length > 0 && <ul className="space-y-4">{screens.map((s, i) => <ScreenCard key={s.id || i} screen={s} />)}</ul>}
            <Alert>Screens created in this session appear here straight away. Screens created earlier appear when the venue list includes them.</Alert>
          </>
        )}
        {tab === 'refunds' && <RefundPolicyForm venue={venue} />}
      </div>
    </>
  );
}
