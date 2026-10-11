import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Building2, CalendarClock, CheckCircle2, Armchair as Chair } from 'lucide-react';
import { getBooking } from '@/api/bookings.api';
import { qk } from '@/api/queryKeys';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AmountBreakdown, InvoiceButton, SeatChips } from '@/components/booking/BookingParts';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { Alert, Badge, Button, ErrorState, LinkButton, Skeleton } from '@/components/ui';
import { BOOKING_STATUS_TONE } from '@/utils/constants';
import { bookingShow, formatDateLong, formatDateTime, isPast } from '@/utils/format';

export default function BookingPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const q = useQuery({ queryKey: qk.booking(bookingId), queryFn: () => getBooking(bookingId) });
  const b = q.data;
  const { title, venue, screen, startTime } = bookingShow(b);
  useDocumentTitle(b ? `Ticket: ${title}` : 'Booking');

  if (q.isLoading) return <div className="container-page max-w-3xl py-8"><Skeleton className="h-96" /></div>;
  if (q.isError) return <div className="container-page max-w-3xl py-8"><ErrorState error={q.error} onRetry={q.refetch} title={q.error.status === 404 ? 'We could not find this booking' : "Couldn't load your booking"} /></div>;

  const booked = b.status === 'Booked';
  const upcoming = booked && !isPast(startTime);
  return (
    <div className="container-page max-w-3xl py-8">
      {location.state?.justBooked && (
        <Alert tone="success" title="You're booked!" className="mb-5">A confirmation is on its way by email and SMS. Show the QR code at the venue entrance.</Alert>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{booked ? 'Your ticket' : 'Booking details'}</h1>
        <Badge tone={BOOKING_STATUS_TONE[b.status] || 'neutral'}>{b.status}</Badge>
      </div>

      <article className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 p-5 sm:p-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              {venue && <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand-600" aria-hidden="true" />{venue}</li>}
              {screen && <li className="flex items-center gap-2"><Chair className="h-4 w-4 text-brand-600" aria-hidden="true" />{screen}</li>}
              {startTime && <li className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />{formatDateLong(startTime)}, {formatDateTime(startTime).split(', ').pop()}</li>}
            </ul>
            <div className="mt-4"><SeatChips seats={b.seats} /></div>
            <p className="mt-5 text-xs text-ink-500">Booking ID</p>
            <p className="break-all font-mono text-sm">{b.id}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-ink-300 bg-ink-50 p-6 sm:w-60 sm:border-l sm:border-t-0">
            {booked && b.qrPayload ? (
              <>
                <div className="rounded-lg bg-white p-3"><QRCodeSVG value={b.qrPayload} size={160} level="M" role="img" aria-label="Entry QR code" /></div>
                <p className="text-center text-xs text-ink-500">Scan at the venue entrance</p>
              </>
            ) : (
              <p className="text-center text-sm text-ink-500">{booked ? 'Your QR code will appear here.' : 'A QR code is issued once payment is confirmed.'}</p>
            )}
          </div>
        </div>
        <div className="border-t border-ink-200 p-5 sm:p-6">
          <h3 className="mb-2 text-sm font-semibold">Payment summary</h3>
          <AmountBreakdown amount={b.amountBreakdown} />
        </div>
      </article>

      <div className="mt-5 flex flex-wrap gap-2">
        {booked && <InvoiceButton bookingId={b.id} />}
        {upcoming && <Button variant="dangerOutline" onClick={() => setCancelOpen(true)}>Cancel booking</Button>}
        {(b.status === 'Locked' || b.status === 'Pending') && <LinkButton to={`/checkout/${b.id}`}>Complete payment</LinkButton>}
        <LinkButton variant="ghost" to="/my-bookings">All my bookings</LinkButton>
      </div>
      {!booked && b.status === 'Cancelled' && <p className="mt-4 flex items-center gap-2 text-sm text-ink-600"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Your seats were released. Refunds take 5–7 business days. <Link to="/help" className="font-semibold text-brand-700 underline">Learn more</Link></p>}
      {b && <CancelBookingDialog booking={b} open={cancelOpen} onClose={() => setCancelOpen(false)} />}
    </div>
  );
}
