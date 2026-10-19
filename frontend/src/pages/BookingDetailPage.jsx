import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getBooking, getBookingStatus, getPaymentStatus } from "../api/bookings.api.js";
import { apiMessage } from "../api/client.js";
import { ErrorMessage, Loading } from "../components/Feedback.jsx";
import { formatDateTime, formatMoney } from "../utils/format.js";

export default function BookingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([getBooking(id), getBookingStatus(id), getPaymentStatus(id)])
      .then(([details, bookingStatus, payment]) => {
        setBooking(details);
        setStatus(bookingStatus.status || payment.status || details.status);
      })
      .catch((reason) => setError(apiMessage(reason, "Couldn't load this booking.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <Loading label="Loading booking details…" />;
  if (error) return <div className="section"><ErrorMessage message={error} onRetry={load} /></div>;
  if (!booking) return <div className="section"><ErrorMessage message="Booking not found." /></div>;

  return (
    <section className="section booking-detail-page">
      <Link className="back-link" to="/bookings">← All bookings</Link>
      <div className="confirmation-mark" aria-hidden="true">{status === "Booked" ? "✓" : "·"}</div>
      <div className="eyebrow"><span className="eyebrow-line" /> BOOKING #{booking.id}</div>
      <h1>{status === "Booked" ? "It’s a date." : "Your booking details."}</h1>
      {location.state?.confirmed && <p className="inline-success" role="status">Payment verified and booking confirmed by ShowTime.</p>}
      <div className="booking-detail-card">
        <div className="booking-detail-heading">
          <div><span className={`status-pill status-${status.toLowerCase()}`}>{status}</span><h2>{booking.show.movieTitle}</h2></div>
          <strong>{formatMoney(booking.amountBreakdown?.grandTotal / 100, booking.amountBreakdown?.currency)}</strong>
        </div>
        <div className="booking-detail-grid">
          <div><span>THEATRE</span><strong>{booking.show.venueName}</strong></div>
          <div><span>SCREEN</span><strong>{booking.show.screenName}</strong></div>
          <div><span>SHOWTIME</span><strong>{formatDateTime(booking.show.startTime)}</strong></div>
          <div><span>SEATS</span><strong>{booking.seats.map((seat) => `${seat.row}${seat.col}`).join(", ") || "—"}</strong></div>
        </div>
      </div>
      <Link className="button button-outline" to="/">Back to movies</Link>
      {status === "Pending" && <p className="muted pending-note">Payment has not been confirmed. <Link to={`/checkout/${booking.id}`}>Continue checkout</Link>.</p>}
    </section>
  );
}
