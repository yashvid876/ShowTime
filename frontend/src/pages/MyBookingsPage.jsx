import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBookings } from "../api/bookings.api.js";
import { apiMessage } from "../api/client.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";
import { formatDateTime, formatMoney } from "../utils/format.js";

export default function MyBookingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    getBookings()
      .then((data) => setItems(data.items || []))
      .catch((reason) => setError(apiMessage(reason, "Couldn't load your bookings.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <section className="section bookings-page">
      <div className="eyebrow"><span className="eyebrow-line" /> YOUR SHOWTIME</div>
      <div className="section-heading">
        <div><h1>Your bookings.</h1><p className="muted">Every good night out, all in one place.</p></div>
      </div>
      {loading && <Loading label="Loading your bookings…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No bookings yet">When you book a show, you’ll find it here.</EmptyState>}
      {!loading && !error && items.length > 0 && (
        <div className="booking-list">
          {items.map((booking) => (
            <Link className="booking-card" to={`/bookings/${booking.id}`} key={booking.id}>
              <div className="booking-ticket-mark" aria-hidden="true">ST</div>
              <div className="booking-card-main">
                <span className={`status-pill status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                <h2>{booking.show.movieTitle}</h2>
                <p>{booking.show.venueName} · {booking.show.screenName}</p>
                <p>{formatDateTime(booking.show.startTime)}</p>
              </div>
              <div className="booking-card-side">
                <span>{booking.seats.map((seat) => `${seat.row}${seat.col}`).join(", ") || "Seats unavailable"}</span>
                <strong>{formatMoney(booking.amountBreakdown?.grandTotal / 100, booking.amountBreakdown?.currency)}</strong>
                <span className="movie-card-link">View booking →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
