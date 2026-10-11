import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Armchair, Building2, CalendarClock, Clock3, Lightbulb, Wifi, WifiOff, X } from 'lucide-react';
import { getSeatMap, getShow } from '@/api/shows.api';
import { lockSeats, releaseBooking } from '@/api/bookings.api';
import { qk } from '@/api/queryKeys';
import { errorMessage } from '@/api/errors';
import { useSeatSocket } from '@/features/seatmap/useSeatSocket';
import { isLockActive, useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SeatLegend, SeatMap } from '@/components/booking/SeatMap';
import { Alert, Button, ErrorState, LinkButton, Skeleton } from '@/components/ui';
import { MAX_SEATS } from '@/utils/constants';
import { formatDateTime, formatMoney, pluralize, seatLabel } from '@/utils/format';

const PENDING_KEY = 'mtbs.pendingSeats';
const TIP_KEY = 'mtbs.seatTipSeen';

function HoldBanner({ lock, onRelease, releasing }) {
  const { label, expired } = useCountdown(lock.lockExpiresAt);
  if (expired) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <p className="text-sm text-ink-800">
        <b>You're holding {pluralize(lock.seats.length, 'seat')}</b> for the next <b className="tabular-nums">{label}</b>. Finish checkout or release them to pick different seats.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onRelease} loading={releasing}>Release seats</Button>
        <LinkButton to={`/checkout/${lock.bookingId}`} size="sm">Continue to checkout</LinkButton>
      </div>
    </div>
  );
}

function Summary({ selected, onContinue, locking, canBook, mobile }) {
  const total = selected.reduce((n, s) => n + s.price, 0);
  if (mobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white p-3 shadow-pop lg:hidden">
        <div className="container-page flex items-center justify-between gap-3 !px-1">
          <div>
            <p className="text-sm font-semibold">{selected.length ? pluralize(selected.length, 'seat') : 'No seats selected'}</p>
            <p className="text-xs text-ink-500">{selected.length ? `${formatMoney(total)} before taxes and fees` : `Select up to ${MAX_SEATS}`}</p>
          </div>
          <Button onClick={onContinue} disabled={!selected.length || !canBook} loading={locking}>Continue</Button>
        </div>
      </div>
    );
  }
  return (
    <aside aria-label="Your selection" className="card sticky top-24 hidden p-5 lg:block">
      <h2 className="text-lg font-semibold">Your seats</h2>
      {selected.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">Select up to {MAX_SEATS} seats on the map.</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-100 text-sm">
          {selected.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span><b>{seatLabel(s)}</b> <span className="text-ink-500">{s.category}</span></span>
              <span className="font-medium">{formatMoney(s.price)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-ink-200 pt-3">
        <span className="text-sm text-ink-600">Subtotal</span>
        <span className="font-display text-xl font-bold">{formatMoney(total)}</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">Taxes and convenience fee are shown at checkout.</p>
      <Button size="lg" className="mt-4 w-full" onClick={onContinue} disabled={!selected.length || !canBook} loading={locking}>Continue to checkout</Button>
    </aside>
  );
}

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lock = useBookingStore((s) => s.lock);
  const setLock = useBookingStore((s) => s.setLock);
  const clearLock = useBookingStore((s) => s.clearLock);
  const [selected, setSelected] = useState(() => new Set());
  const [tipSeen, setTipSeen] = useState(() => localStorage.getItem(TIP_KEY) === '1');

  const showQ = useQuery({ queryKey: qk.show(showId), queryFn: () => getShow(showId) });
  const mapQ = useQuery({ queryKey: qk.seatmap(showId), queryFn: () => getSeatMap(showId) });
  const show = showQ.data;
  useDocumentTitle(show?.movieTitle || show?.title || 'Select seats');

  const activeLock = lock && lock.showId === showId && isLockActive(lock) ? lock : null;
  const { expired: lockExpired } = useCountdown(lock?.lockExpiresAt);
  useEffect(() => { if (lock && lockExpired) clearLock(); }, [lock, lockExpired, clearLock]);

  const onBookingExpired = useCallback((bookingId) => {
    if (useBookingStore.getState().lock?.bookingId === bookingId) {
      clearLock();
      toast.info('Your seat hold expired and the seats were released.');
    }
  }, [clearLock]);
  const { live, connected } = useSeatSocket(showId, { onBookingExpired });

  const mineIds = useMemo(() => new Set((activeLock?.seats || []).map((s) => s.id)), [activeLock]);
  const seats = useMemo(() => {
    return (mapQ.data?.seats || []).map((s) => {
      const o = live[s.id];
      const status = o?.status ?? s.status;
      let ui = status;
      if (mineIds.has(s.id) || (status === 'locked' && o?.lockedBy === 'me')) ui = 'mine';
      else if (status === 'available' && selected.has(s.id)) ui = 'selected';
      return { ...s, status, ui };
    });
  }, [mapQ.data, live, selected, mineIds]);

  // Restore seats picked before a login redirect.
  useEffect(() => {
    if (!mapQ.data) return;
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
      if (pending?.showId === showId) {
        const ok = mapQ.data.seats.filter((s) => pending.ids.includes(s.id) && s.status === 'available').map((s) => s.id);
        setSelected(new Set(ok));
      }
    } catch { /* ignore corrupt value */ }
    sessionStorage.removeItem(PENDING_KEY);
  }, [mapQ.data, showId]);

  // Drop seats someone else just took.
  useEffect(() => {
    const taken = seats.filter((s) => selected.has(s.id) && s.status !== 'available');
    if (taken.length) {
      setSelected((prev) => { const n = new Set(prev); taken.forEach((s) => n.delete(s.id)); return n; });
      toast.info(`${taken.map(seatLabel).join(', ')} ${taken.length > 1 ? 'were' : 'was'} just taken.`);
    }
  }, [seats, selected]);

  const toggle = (seat) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(seat.id)) n.delete(seat.id);
      else if (n.size >= MAX_SEATS) toast.info(`You can book up to ${MAX_SEATS} seats at a time.`);
      else n.add(seat.id);
      return n;
    });
  };

  const lockM = useMutation({
    mutationFn: () => lockSeats({ showId, seatIds: [...selected] }),
    onSuccess: (d) => {
      setLock({ bookingId: d.bookingId, showId, seats: d.seats, lockExpiresAt: d.lockExpiresAt, amountBreakdown: d.amountBreakdown });
      navigate(`/checkout/${d.bookingId}`);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      if (e.code === 'SEAT_UNAVAILABLE') { setSelected(new Set()); qc.invalidateQueries({ queryKey: qk.seatmap(showId) }); }
    },
  });
  const releaseM = useMutation({
    mutationFn: () => releaseBooking(activeLock.bookingId),
    onSuccess: () => { clearLock(); toast.success('Seats released.'); qc.invalidateQueries({ queryKey: qk.seatmap(showId) }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const selectedSeats = seats.filter((s) => s.ui === 'selected');
  const canBook = show?.status !== 'cancelled';
  const onContinue = () => {
    if (!user) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ showId, ids: [...selected] }));
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (user.role !== 'patron') { toast.error('Only patron accounts can book seats.'); return; }
    lockM.mutate();
  };

  const dismissTip = () => { localStorage.setItem(TIP_KEY, '1'); setTipSeen(true); };
  const title = show?.movieTitle || show?.title || show?.movieEvent?.title;
  const venue = show?.venueName || show?.venue?.name;
  const screen = show?.screenName || show?.screen?.name;

  return (
    <div className="container-page pb-28 pt-6 lg:pb-10">
      <header className="mb-5">
        {showQ.isLoading ? <Skeleton className="h-16 w-2/3" /> : showQ.isError ? null : (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">{title || 'Select your seats'}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
              {venue && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" aria-hidden="true" />{venue}</span>}
              {screen && <span className="inline-flex items-center gap-1.5"><Armchair className="h-4 w-4" aria-hidden="true" />{screen}{show?.format ? `, ${show.format}` : ''}</span>}
              {show?.startTime && <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4" aria-hidden="true" />{formatDateTime(show.startTime)}</span>}
            </p>
          </>
        )}
      </header>

      {showQ.isError && <ErrorState error={showQ.error} onRetry={showQ.refetch} title={showQ.error.status === 404 ? 'This show no longer exists' : "Couldn't load this show"} />}
      {show?.status === 'cancelled' && <Alert tone="error" title="This show was cancelled" className="mb-4">Seats can't be booked. <Link to="/" className="font-semibold underline">Find another show</Link>.</Alert>}
      {activeLock && <HoldBanner lock={activeLock} onRelease={() => releaseM.mutate()} releasing={releaseM.isPending} />}
      {!tipSeen && !showQ.isError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-gold-300 bg-gold-100 p-4 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
          <p className="flex-1 text-ink-800">Tap seats to select them. Once you continue, your seats are held for a few minutes while you pay. Greyed-out seats are taken, and the map updates live.</p>
          <button type="button" onClick={dismissTip} aria-label="Dismiss tip" className="text-ink-500 hover:text-ink-900"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="card -mx-2 min-w-0 flex-1 p-2 sm:mx-0 sm:p-6" aria-label="Seat map">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SeatLegend />
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-ok-700' : 'text-ink-500'}`} role="status">
              {connected ? <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
              {connected ? 'Live updates on' : 'Connecting to live updates'}
            </span>
          </div>
          {mapQ.isLoading && <div className="space-y-2" aria-label="Loading seat map">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="mx-auto h-8 w-4/5" />)}</div>}
          {mapQ.isError && <ErrorState error={mapQ.error} onRetry={mapQ.refetch} title="Couldn't load the seat map" />}
          {mapQ.data && seats.length === 0 && <p className="py-10 text-center text-sm text-ink-500">This screen has no seats configured yet.</p>}
          {mapQ.data && seats.length > 0 && <SeatMap seats={seats} onToggle={toggle} disabled={!!activeLock || lockM.isPending || !canBook} />}
          {mapQ.data && <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-500"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Seats are held for a few minutes once you continue to checkout.</p>}
        </section>

        <div className="lg:w-80 lg:shrink-0">
          <Summary selected={selectedSeats} onContinue={onContinue} locking={lockM.isPending} canBook={canBook && !activeLock} />
        </div>
      </div>
      <Summary mobile selected={selectedSeats} onContinue={onContinue} locking={lockM.isPending} canBook={canBook && !activeLock} />
    </div>
  );
}
