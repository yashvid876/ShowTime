import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../api/bookings.api.js";
import { apiMessage } from "../api/client.js";
import { acquireSeatLock, getSeatMap, getShow, releaseSeatLock } from "../api/shows.api.js";
import { ErrorMessage, Loading } from "../components/Feedback.jsx";
import { formatMoney, formatTime } from "../utils/format.js";

const SEAT_LIMIT = 10;

export default function SeatSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seatMap, setSeatMap] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heldSeats = useRef(new Set());
  const heldUntil = useRef(new Map());
  const bookingCreated = useRef(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const bookingSubmitting = useRef(false);

  const load = useCallback((preserveError = false) => {
    setLoading(true);
    if (!preserveError) setError("");
    Promise.all([getShow(id), getSeatMap(id)])
      .then(([showData, mapData]) => {
        setShow(showData);
        setSeatMap(mapData);
      })
      .catch((reason) => {
        const message = apiMessage(reason, "Couldn't load this show's seats.");
        setError((current) => preserveError && current
          ? `${current} Seat map refresh failed: ${message}`
          : message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      if (!bookingCreated.current) {
        for (const seatId of heldSeats.current) {
          releaseSeatLock(id, seatId).catch((reason) => {
            console.error("Seat lock release failed during navigation:", reason.message);
          });
        }
      }
    };
  }, [id, load]);

  useEffect(() => {
    if (!holdExpiresAt) return undefined;
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [holdExpiresAt]);

  const refreshEarliestExpiry = () => {
    const deadlines = [...heldUntil.current.values()];
    setHoldExpiresAt(deadlines.length ? Math.min(...deadlines) : null);
  };

  const groupedSeats = useMemo(() => {
    const groups = new Map();
    for (const seat of seatMap?.seats || []) {
      if (!groups.has(seat.row)) groups.set(seat.row, []);
      groups.get(seat.row).push(seat);
    }
    return [...groups.entries()];
  }, [seatMap]);

  const categories = useMemo(() => {
    const pricesByCategory = new Map();
    for (const seat of seatMap?.seats || []) {
      const name = seat.category || "regular";
      if (!pricesByCategory.has(name)) pricesByCategory.set(name, []);
      pricesByCategory.get(name).push(Number(seat.price || 0));
    }
    return [...pricesByCategory.entries()].map(([name, prices]) => ({
      name,
      price: Math.min(...prices),
    }));
  }, [seatMap]);

  const expirySeconds = holdExpiresAt
    ? Math.max(0, Math.ceil((holdExpiresAt - currentTime) / 1000))
    : null;
  const expiryCountdown = expirySeconds === null
    ? ""
    : `${String(Math.floor(expirySeconds / 60)).padStart(2, "0")}:${String(expirySeconds % 60).padStart(2, "0")}`;

  const toggleSeat = async (seat) => {
    if (busy) return;
    setError("");
    const alreadySelected = selected.some((item) => item.id === seat.id);
    if (alreadySelected) {
      try {
        await releaseSeatLock(id, seat.id);
        heldSeats.current.delete(seat.id);
        heldUntil.current.delete(seat.id);
        refreshEarliestExpiry();
        setSelected((current) => current.filter((item) => item.id !== seat.id));
      } catch (reason) {
        if (reason.response?.status === 409) {
          heldSeats.current.delete(seat.id);
          heldUntil.current.delete(seat.id);
          refreshEarliestExpiry();
          setSelected((current) => current.filter((item) => item.id !== seat.id));
          load();
          setError("This seat hold has expired. Please choose a seat again.");
        } else {
          setError(apiMessage(reason, "The seat could not be released."));
        }
      }
      return;
    }

    if (selected.length >= SEAT_LIMIT) {
      setError(`You can select up to ${SEAT_LIMIT} seats for one booking.`);
      return;
    }

    try {
      const lock = await acquireSeatLock(id, seat.id);
      heldSeats.current.add(seat.id);
      heldUntil.current.set(
        seat.id,
        Date.now() + Number(lock.expiresInSeconds || 0) * 1000,
      );
      refreshEarliestExpiry();
      setSelected((current) => [...current, seat]);
    } catch (reason) {
      setError(apiMessage(reason, "This seat could not be held. Please choose another."));
      if (reason.response?.status === 409) load();
    }
  };

  const total = selected.reduce((sum, seat) => sum + Number(seat.price || 0), 0);

  const continueToCheckout = async () => {
    if (!selected.length || busy || bookingSubmitting.current) return;
    bookingSubmitting.current = true;
    setBusy(true);
    setError("");
    try {
      const booking = await createBooking(id, selected.map((seat) => seat.id));
      const bookingSeats = Array.isArray(booking?.seats) ? booking.seats : [];
      const returnedSeatIds = new Set(bookingSeats.map((seat) => Number(seat.id)));
      const responseIsValid = Number.isInteger(Number(booking?.bookingId)) &&
        Number(booking.bookingId) > 0 &&
        typeof booking?.razorpayOrderId === "string" &&
        booking.razorpayOrderId.trim().length > 0 &&
        Number.isFinite(Number(booking?.amount)) &&
        Number(booking.amount) > 0 &&
        booking.currency === "INR" &&
        typeof booking?.lockExpiresAt === "string" &&
        Number.isFinite(Date.parse(booking.lockExpiresAt)) &&
        bookingSeats.length === selected.length &&
        returnedSeatIds.size === selected.length &&
        selected.every((seat) => returnedSeatIds.has(Number(seat.id)));
      if (!responseIsValid) {
        throw new Error("The booking service returned incomplete details. Please refresh the seat map and try again.");
      }
      bookingCreated.current = true;
      navigate(`/checkout/${booking.bookingId}`, {
        state: { lockExpiresAt: booking.lockExpiresAt },
      });
    } catch (reason) {
      const incompleteResponse = "The booking service returned incomplete details. Please refresh the seat map and try again.";
      const message = reason?.message === incompleteResponse
        ? incompleteResponse
        : apiMessage(reason, "The booking could not be started. Your seats may no longer be available.");
      setError(message);
      let releaseFailed = false;
      for (const seatId of heldSeats.current) {
        try {
          await releaseSeatLock(id, seatId);
        } catch (releaseError) {
          if (releaseError.response?.status !== 409) releaseFailed = true;
        }
      }
      if (releaseFailed) {
        setError(`${message} At least one temporary seat hold could not be released and will expire automatically.`);
      }
      heldSeats.current.clear();
      heldUntil.current.clear();
      setHoldExpiresAt(null);
      setSelected([]);
      await load(true);
    } finally {
      bookingSubmitting.current = false;
      setBusy(false);
    }
  };

  if (loading) return <Loading label="Preparing the seat map…" />;
  if (error && !seatMap) return <div className="section"><ErrorMessage message={error} onRetry={load} /></div>;
  if (!seatMap || !show) return <div className="section"><ErrorMessage message="Show information is unavailable." onRetry={load} /></div>;

  return (
    <section className="section seat-page">
      <Link className="back-link" to={`/movies/${show.movie_id}`}>← Back to showtimes</Link>
      <div className="section-heading seat-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> MAKE IT YOURS</div>
          <h1>Pick your seats.</h1>
          <p className="muted">{show.movie_title} · {show.theatre_name} · {formatTime(show.start_time)}</p>
        </div>
        <span className="seat-limit-note">Up to {SEAT_LIMIT} seats</span>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {seatMap.seats?.length ? (
        <div className="seat-layout">
          <div className="seat-map-panel">
            <div className="screen-arch"><span>SCREEN</span></div>
            <div className="seat-grid">
              {groupedSeats.map(([row, seats]) => (
                <div className="seat-row" key={row}>
                  <span className="row-label">{row}</span>
                  <div className="row-seats">
                    {seats.map((seat) => {
                      const isSelected = selected.some((item) => item.id === seat.id);
                      const status = String(seat.status || "").toLowerCase();
                      const unavailable = status !== "available";
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          className={`seat ${isSelected ? "seat-selected" : ""} ${unavailable ? "seat-unavailable" : ""} seat-${seat.category || "regular"}`}
                          disabled={unavailable || busy}
                          aria-label={`Row ${seat.row}, seat ${seat.col}, ${unavailable ? "unavailable" : isSelected ? "selected" : "available"}, ${formatMoney(seat.price)}`}
                          aria-pressed={isSelected}
                          title={`${seat.row}${seat.col} · ${seat.category || "regular"} · ${formatMoney(seat.price)}`}
                          onClick={() => toggleSeat(seat)}
                        >
                          {seat.col}
                        </button>
                      );
                    })}
                  </div>
                  <span className="row-label">{row}</span>
                </div>
              ))}
            </div>
            <div className="seat-legend">
              <span><i className="legend-seat available" /> Available</span>
              <span><i className="legend-seat selected" /> Selected</span>
              <span><i className="legend-seat unavailable" /> Unavailable</span>
              {categories.map((category) => (
                <span key={category.name}>
                  <i className={`legend-seat category-${category.name}`} />
                  {category.name} · {formatMoney(category.price)}
                </span>
              ))}
            </div>
          </div>
          <aside className="selection-card">
            <span className="eyebrow"><span className="eyebrow-line" /> YOUR SELECTION</span>
            <h2>{selected.length ? `${selected.length} seat${selected.length > 1 ? "s" : ""}` : "Choose a seat"}</h2>
            <p className="muted">
              {expiryCountdown
                ? `Seat hold expires in ${expiryCountdown}.`
                : "Select a seat to see its hold timer."}
            </p>
            <div className="selected-tags">
              {selected.length
                ? selected.map((seat) => <span key={seat.id}>{seat.row}{seat.col}</span>)
                : <span className="muted">No seats selected yet</span>}
            </div>
            <div className="total-line"><span>Total</span><strong>{formatMoney(total)}</strong></div>
            <button className="button button-primary button-full" disabled={!selected.length || busy} onClick={continueToCheckout}>
              {busy ? "Creating booking…" : "Continue to payment"} <span aria-hidden="true">→</span>
            </button>
            <p className="secure-note">Payment is handled securely by Razorpay.</p>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h2>Seat map unavailable</h2>
          <p>This show has no seat inventory yet. Please choose another showtime.</p>
        </div>
      )}
    </section>
  );
}
