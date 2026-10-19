import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getBooking, initiatePayment, releaseBooking, verifyPayment, getBookingStatus } from "../api/bookings.api.js";
import { apiMessage } from "../api/client.js";
import { ErrorMessage, Loading } from "../components/Feedback.jsx";
import { formatDateTime, formatMoney } from "../utils/format.js";

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout couldn't be loaded."));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getBooking(id), initiatePayment(Number(id))])
      .then(([bookingData, paymentData]) => {
        if (!active) return;
        setBooking(bookingData);
        setPayment(paymentData);
      })
      .catch((reason) => {
        if (active) setError(apiMessage(reason, "This booking is not ready for payment."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const startPayment = async () => {
    setError("");
    setMessage("");
    if (!payment?.keyId || !payment?.orderId) {
      setError("Online checkout is unavailable because the server did not provide a Razorpay key and order.");
      return;
    }

    setBusy(true);
    try {
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "ShowTime",
        description: booking.show.movieTitle,
        order_id: payment.orderId,
        handler: async (response) => {
          setError("");
          setMessage("Payment received. Confirming your booking…");
          try {
            await verifyPayment({
              bookingId: Number(id),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const status = await getBookingStatus(id);
            if (status.status !== "Booked") {
              throw new Error("Payment was received but the booking is not confirmed yet. Check booking status in a moment.");
            }
            navigate(`/bookings/${id}`, { replace: true, state: { confirmed: true } });
          } catch (reason) {
            setMessage("");
            setError(reason.response
              ? apiMessage(reason, "Payment confirmation is pending. Check your booking status.")
              : reason.message);
          }
        },
        modal: {
          ondismiss: () => setMessage("Checkout was closed. Your booking remains pending until you release it or it expires."),
        },
        theme: { color: "#e2aa61" },
      });
      checkout.on("payment.failed", (failure) => {
        setError(failure.error?.description || "Payment did not complete. Your booking remains pending.");
      });
      checkout.open();
    } catch (reason) {
      setError(reason.message || "Could not start Razorpay checkout.");
    } finally {
      setBusy(false);
    }
  };

  const cancelPendingBooking = async () => {
    setBusy(true);
    setError("");
    try {
      await releaseBooking(id);
      navigate("/bookings", { replace: true });
    } catch (reason) {
      setError(apiMessage(reason, "This booking could not be released."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading label="Preparing secure checkout…" />;
  if (error && !booking) return <div className="section"><ErrorMessage message={error} /></div>;
  if (!booking) return <div className="section"><ErrorMessage message="Booking not found." /></div>;

  return (
    <section className="section checkout-section">
      <Link className="back-link" to={`/bookings/${id}`}>← Booking details</Link>
      <div className="checkout-layout">
        <div className="checkout-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> ONE LAST THING</div>
          <h1>Ready for<br /><em>the show?</em></h1>
          <p>Your seats are held temporarily. Complete payment to confirm the booking.</p>
          {error && <div className="inline-error" role="alert">{error}</div>}
          {message && <div className="inline-success" role="status">{message}</div>}
          <button className="button button-primary" onClick={startPayment} disabled={busy || booking.status !== "Pending"}>
            {busy ? "Opening checkout…" : "Pay securely"} <span aria-hidden="true">→</span>
          </button>
          <button className="text-button release-button" onClick={cancelPendingBooking} disabled={busy}>
            Release this booking
          </button>
        </div>
        <aside className="checkout-summary">
          <span className="eyebrow"><span className="eyebrow-line" /> BOOKING SUMMARY</span>
          <h2>{booking.show.movieTitle}</h2>
          <p>{booking.show.venueName} · {booking.show.screenName}</p>
          <p>{formatDateTime(booking.show.startTime)}</p>
          {location.state?.lockExpiresAt && (
            <p className="hold-expiry">
              Seat hold expires at{" "}
              {new Date(location.state.lockExpiresAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </p>
          )}
          <div className="summary-seats">
            <span>Seats</span>
            <strong>{booking.seats.map((seat) => `${seat.row}${seat.col}`).join(", ") || "—"}</strong>
          </div>
          <div className="total-line"><span>Total</span><strong>{formatMoney(booking.amountBreakdown?.grandTotal / 100, booking.amountBreakdown?.currency)}</strong></div>
          <span className="status-pill status-pending">{booking.status}</span>
        </aside>
      </div>
    </section>
  );
}
