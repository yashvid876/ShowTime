import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarClock, Ticket } from 'lucide-react';
import { listMyBookings } from '@/api/bookings.api';
import { qk } from '@/api/queryKeys';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { InvoiceButton, SeatChips } from '@/components/booking/BookingParts';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { Badge, Button, EmptyState, ErrorState, LinkButton, PageHeader, Pagination, Skeleton, Tabs } from '@/components/ui';
import { BOOKING_STATUS_TONE, BOOKING_TABS } from '@/utils/constants';
import { bookingShow, formatDateTime, formatMoney, isPast } from '@/utils/format';

const LIMIT = 10;
const EMPTY = {
  Upcoming: ['No upcoming bookings', 'When you book a show it will show up here.'],
  Completed: ['No past bookings yet', "Shows you've attended will be listed here."],
  Cancelled: ['No cancelled bookings', "Bookings you cancel will be listed here."],
};

function BookingCard({ b, onCancel }) {
  const { title, venue, screen, startTime } = bookingShow(b);
  const booked = b.status === 'Booked';
  const upcoming = booked && !isPast(startTime);
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/bookings/${b.id}`} className="font-display text-lg font-semibold hover:text-brand-700">{title}</Link>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-600">
            {venue && <li className="flex items-center gap-2"><Building2 className="h-4 w-4" aria-hidden="true" />{venue}{screen ? `, ${screen}` : ''}</li>}
            {startTime && <li className="flex items-center gap-2"><CalendarClock className="h-4 w-4" aria-hidden="true" />{formatDateTime(startTime)}</li>}
          </ul>
        </div>
        <div className="text-right">
          <Badge tone={BOOKING_STATUS_TONE[b.status] || 'neutral'}>{b.status}</Badge>
          {b.amountBreakdown && <p className="mt-2 font-display text-lg font-bold">{formatMoney(b.amountBreakdown.grandTotal)}</p>}
        </div>
      </div>
      <div className="mt-3"><SeatChips seats={b.seats} /></div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
        <LinkButton to={`/bookings/${b.id}`} size="sm" variant={booked ? 'primary' : 'secondary'}>{booked ? 'View ticket' : 'View details'}</LinkButton>
        {booked && <InvoiceButton bookingId={b.id} size="sm" />}
        {upcoming && <Button size="sm" variant="dangerOutline" onClick={() => onCancel(b)}>Cancel</Button>}
      </div>
    </li>
  );
}

export default function MyBookingsPage() {
  useDocumentTitle('My bookings');
  const [params, setParams] = useSearchParams();
  const status = BOOKING_TABS.includes(params.get('status')) ? params.get('status') : 'Upcoming';
  const page = Number(params.get('page')) || 1;
  const [cancelling, setCancelling] = useState(null);
  const q = useQuery({ queryKey: qk.myBookings(status, page), queryFn: () => listMyBookings({ status, page, limit: LIMIT }), placeholderData: (p) => p });

  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title="My bookings" description="Your tickets, past and upcoming." />
      <Tabs label="Booking status" value={status} onChange={(v) => setParams({ status: v })} tabs={BOOKING_TABS.map((t) => ({ value: t, label: t }))} />
      <div className="mt-5">
        {q.isLoading && <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>}
        {q.isError && <ErrorState error={q.error} onRetry={q.refetch} title="Couldn't load your bookings" />}
        {q.data && q.data.items.length === 0 && (
          <EmptyState icon={Ticket} title={EMPTY[status][0]} action={status === 'Upcoming' ? <LinkButton to="/">Browse shows</LinkButton> : null}>{EMPTY[status][1]}</EmptyState>
        )}
        {q.data && q.data.items.length > 0 && (
          <ul className="space-y-3">{q.data.items.map((b) => <BookingCard key={b.id} b={b} onCancel={setCancelling} />)}</ul>
        )}
        {q.data && <Pagination page={page} total={q.data.total} limit={LIMIT} onChange={(p) => setParams({ status, page: String(p) })} />}
      </div>
      {cancelling && <CancelBookingDialog booking={cancelling} open onClose={() => setCancelling(null)} />}
    </div>
  );
}
