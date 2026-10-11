import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Armchair, Building2, CalendarClock, Clock, ShieldCheck } from 'lucide-react';
import { getBooking, releaseBooking } from '@/api/bookings.api';
import { initiatePayment } from '@/api/payments.api';
import { qk } from '@/api/queryKeys';
import { errorMessage } from '@/api/errors';
import { loadRazorpay } from '@/features/booking/razorpay';
import { pollBookingStatus } from '@/features/booking/pollBookingStatus';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AmountBreakdown, SeatChips } from '@/components/booking/BookingParts';
import { Alert, Button, Checkbox, ErrorState, LinkButton, Skeleton, Spinner } from '@/components/ui';
import { bookingShow, formatDateTime } from '@/utils/format';

const TERMS_KEY = 'mtbs.termsAccepted';

function Countdown({ expiresAt }) {
  const { label, expired, remainingMs } = useCountdown(expiresAt);
  if (expired) return null;
  const urgent = remainingMs < 60000;
  return (
    <div role="timer" aria-live="off" className={`mb-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${urgent ? 'bg-danger-50 text-danger-700' : 'bg-gold-100 text-ink-900'}`}>
      <Clock className="h-4 w-4" aria-hidden="true" />
      Your seats are held for <b className="tabular-nums">{label}</b>. Complete payment before the timer ends.
    </div>
  );
}

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lock = useBookingStore((s) => s.lock);
  const clearLock = useBookingStore((s) => s.clearLock);
  const [accepted, setAccepted] = useState(() => localStorage.getItem(TERMS_KEY) === '1');
  const [termsError, setTermsError] = useState(false);
  // idle | initiating | awaiting (gateway window open) | polling | failed | expired | timeout
  const [phase, setPhaseState] = useState('idle');
  const phaseRef = useRef('idle');
  const setPhase = (p) => { phaseRef.current = p; setPhaseState(p); };
  const [failureReason, setFailureReason] = useState('');
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const q = useQuery({ queryKey: qk.booking(bookingId), queryFn: () => getBooking(bookingId) });
  const booking = q.data;
  const { title, venue, screen, startTime } = bookingShow(booking);
  useDocumentTitle('Checkout');

  const expiresAt = booking?.lockExpiresAt || (lock?.bookingId === bookingId ? lock.lockExpiresAt : null);
  const { expired: holdExpired } = useCountdown(expiresAt);
  const amount = booking?.amountBreakdown || (lock?.bookingId === bookingId ? lock.amountBreakdown : null);
  const seats = booking?.seats || (lock?.bookingId === bookingId ? lock.seats : []);

  const releaseM = useMutation({
    mutationFn: () => releaseBooking(bookingId),
    onSuccess: () => { clearLock(); toast.success('Seats released.'); navigate(`/shows/${booking.showId}/seats`, { replace: true }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const beginPolling = async () => {
    setPhase('polling');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await pollBookingStatus(bookingId, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      if (res.status === 'Booked') {
        clearLock();
        qc.invalidateQueries({ queryKey: ['bookings'] });
        qc.invalidateQueries({ queryKey: qk.booking(bookingId) });
        navigate(`/bookings/${bookingId}`, { replace: true, state: { justBooked: true } });
      } else if (res.status === 'Failed') {
        clearLock();
        setFailureReason(res.failureReason || 'The payment could not be completed.');
        setPhase('failed');
      } else if (res.status === 'Expired' || res.status === 'Cancelled') {
        clearLock();
        setPhase('expired');
      } else if (res.status === 'Timeout') {
        setPhase('timeout');
      }
    } catch (e) {
      toast.error(errorMessage(e));
      setPhase('timeout');
    }
  };

  const pay = async () => {
    if (!accepted) { setTermsError(true); return; }
    localStorage.setItem(TERMS_KEY, '1');
    setPhase('initiating');
    try {
      const order = await initiatePayment(bookingId);
      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'ShowTime',
        description: `${title}${seats.length ? `, ${seats.map((s) => `${s.row}${s.col}`).join(' ')}` : ''}`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#8A2549' },
        // The client callback is NOT proof of payment (BR-5): it only starts waiting for the webhook-confirmed status.
        handler: () => beginPolling(),
        modal: { ondismiss: () => { if (phaseRef.current === 'awaiting') setPhase('idle'); } },
      });
      rzp.on?.('payment.failed', (r) => toast.error(r?.error?.description || 'Payment failed. You can try again.'));
      setPhase('awaiting');
      rzp.open();
    } catch (e) {
      if (e.code === 'LOCK_EXPIRED') { clearLock(); setPhase('expired'); return; }
      setPhase('idle');
      toast.error(errorMessage(e));
    }
  };

  const backToSeats = booking?.showId ? `/shows/${booking.showId}/seats` : lock?.showId ? `/shows/${lock.showId}/seats` : '/';
  const status = booking?.status;
  const dead = useMemo(() => ['Expired', 'Cancelled', 'Failed'].includes(status), [status]);

  if (q.isLoading) return <div className="container-page py-8"><Skeleton className="h-64" /></div>;
  if (q.isError) return <div className="container-page py-8"><ErrorState error={q.error} onRetry={q.refetch} title={q.error.status === 404 ? 'We could not find this booking' : "Couldn't load checkout"} /></div>;
  if (status === 'Booked') return <Navigate to={`/bookings/${bookingId}`} replace />;

  const expired = phase === 'expired' || dead || (holdExpired && phase !== 'polling' && phase !== 'awaiting');
  const busy = phase === 'initiating' || phase === 'awaiting' || phase === 'polling';

  return (
    <div className="container-page max-w-4xl py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
      <p className="mb-5 mt-1 text-sm text-ink-500">Review your order and pay securely.</p>
      {!expired && phase !== 'failed' && expiresAt && <Countdown expiresAt={expiresAt} />}

      {expired && (
        <Alert tone="error" title={status === 'Cancelled' ? 'This booking was cancelled' : 'Your seat hold has ended'} className="mb-5">
          The seats were released so others can book them. <Link to={backToSeats} className="font-semibold underline">Choose seats again</Link>.
        </Alert>
      )}
      {phase === 'failed' && (
        <Alert tone="error" title="Payment didn't go through" className="mb-5">
          {failureReason} Your seats were released. <Link to={backToSeats} className="font-semibold underline">Pick seats and try again</Link>.
        </Alert>
      )}
      {phase === 'timeout' && (
        <Alert tone="warn" title="Still waiting for payment confirmation" className="mb-5">
          We haven't heard back from the payment provider yet. If money left your account, your ticket will appear in My bookings shortly. You won't be charged twice.
          <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={beginPolling}>Check again</Button><LinkButton size="sm" variant="ghost" to="/my-bookings">Go to My bookings</LinkButton></div>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        <section className="card p-5 md:col-span-3" aria-label="Order details">
          <h2 className="text-lg font-semibold">{title}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-600">
            {venue && <li className="flex items-center gap-2"><Building2 className="h-4 w-4" aria-hidden="true" />{venue}</li>}
            {screen && <li className="flex items-center gap-2"><Armchair className="h-4 w-4" aria-hidden="true" />{screen}</li>}
            {startTime && <li className="flex items-center gap-2"><CalendarClock className="h-4 w-4" aria-hidden="true" />{formatDateTime(startTime)}</li>}
          </ul>
          <h3 className="mb-2 mt-5 text-sm font-semibold text-ink-700">{seats.length} {seats.length === 1 ? 'seat' : 'seats'}</h3>
          <SeatChips seats={seats} />
          {!expired && phase !== 'failed' && <button type="button" onClick={() => releaseM.mutate()} disabled={busy || releaseM.isPending} className="mt-6 text-sm font-semibold text-ink-600 underline hover:text-ink-900 disabled:opacity-50">Release seats and go back</button>}
        </section>

        <section className="card p-5 md:col-span-2" aria-label="Payment">
          <h2 className="mb-2 text-lg font-semibold">Price details</h2>
          <AmountBreakdown amount={amount} />
          <Checkbox className="mt-5" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setTermsError(false); }} error={termsError ? 'Accept the terms to continue' : undefined}
            label={<>I agree to the <Link to="/terms" target="_blank" className="font-semibold text-brand-700 underline">Terms</Link> and <Link to="/refund-policy" target="_blank" className="font-semibold text-brand-700 underline">Cancellation &amp; Refund Policy</Link>.</>} />
          <Button size="lg" className="mt-4 w-full" onClick={pay} loading={phase === 'initiating'} disabled={expired || phase === 'failed' || phase === 'polling' || phase === 'awaiting' || phase === 'timeout'}>
            {phase === 'awaiting' ? 'Complete payment in the window' : 'Pay now'}
          </Button>
          {phase === 'polling' && <p className="mt-3 flex items-center gap-2 text-sm text-ink-600" role="status"><Spinner label="Confirming payment" />Confirming your payment. Please don't close this page.</p>}
          <p className="mt-4 flex items-start gap-2 text-xs text-ink-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" aria-hidden="true" />Card and UPI details go straight to the payment provider. ShowTime never sees or stores them.</p>
        </section>
      </div>
    </div>
  );
}
