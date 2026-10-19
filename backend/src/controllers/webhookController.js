import crypto from "crypto";
import { pool } from "../config/db.js";
import { releaseSeat } from "../utils/seatLock.js";

const releaseBookingLocks = async (showId, seatIds, userId) => {
  for (const seatId of seatIds) {
    try {
      await releaseSeat(showId, seatId, userId);
    } catch (err) {
      console.error("Release failed after webhook confirmation:", err.message);
    }
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).send("Missing webhook signature or secret");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    const supplied = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      supplied.length !== expected.length ||
      !crypto.timingSafeEqual(supplied, expected)
    ) {
      return res.status(400).send("Invalid webhook signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));

    if (event.event !== "payment.captured") {
      return res.status(200).send("Event ignored");
    }

    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;

    if (!payment || !orderId || payment.status !== "captured") {
      return res.status(400).send("Invalid payment event");
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [bookings] = await connection.execute(
        `SELECT booking_id, user_id, show_id, status, total_amount
         FROM bookings
         WHERE stripe_session_id = ?
         FOR UPDATE`,
        [orderId],
      );

      if (!bookings.length) {
        await connection.rollback();
        // Ask Razorpay to retry later if the booking is not found yet.
        return res.status(500).send("Booking not found for order");
      }

      const booking = bookings[0];

      if (
        payment.currency !== "INR" ||
        Number(payment.amount) !== Math.round(Number(booking.total_amount) * 100)
      ) {
        await connection.rollback();
        return res.status(400).send("Payment amount or currency does not match booking");
      }

      if (booking.status !== "pending" && booking.status !== "confirmed") {
        await connection.rollback();
        return res.status(200).send("Booking is not pending");
      }

      const [bookingSeats] = await connection.execute(
        `SELECT bs.show_seat_id, ss.seat_id, ss.show_id, ss.status
         FROM booking_seats bs
         JOIN show_seats ss
           ON ss.show_seat_id = bs.show_seat_id
         WHERE bs.booking_id = ?
         FOR UPDATE`,
        [booking.booking_id],
      );

      if (!bookingSeats.length) {
        await connection.rollback();
        return res.status(500).send("Booking has no assigned seats");
      }

      if (booking.status === "pending") {
        if (bookingSeats.some((seat) => seat.status !== "available")) {
          await connection.rollback();
          return res.status(500).send("Seat inventory conflict");
        }

        const seatPlaceholders = bookingSeats.map(() => "?").join(",");
        const [otherActiveAssignments] = await connection.execute(
          `SELECT bs.show_seat_id
           FROM booking_seats bs
           JOIN bookings b ON b.booking_id = bs.booking_id
           WHERE bs.active_show_seat_id IN (${seatPlaceholders})
             AND bs.booking_id <> ?
             AND b.status IN ('pending', 'confirmed')
           LIMIT 1`,
          [
            ...bookingSeats.map((seat) => seat.show_seat_id),
            booking.booking_id,
          ],
        );
        if (otherActiveAssignments.length) {
          await connection.rollback();
          return res.status(500).send("Seat inventory conflict");
        }

        for (const seat of bookingSeats) {
          await connection.execute(
            `UPDATE show_seats
             SET status = 'booked'
             WHERE show_seat_id = ?`,
            [seat.show_seat_id],
          );
        }

        await connection.execute(
          `UPDATE bookings
           SET status = 'confirmed'
           WHERE booking_id = ?`,
          [booking.booking_id],
        );
      }

      await connection.commit();
      await releaseBookingLocks(
        booking.show_id,
        bookingSeats.map((seat) => seat.seat_id),
        booking.user_id,
      );
      return res.status(200).send(
        booking.status === "confirmed" ? "Already processed" : "Booking confirmed",
      );
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Razorpay webhook error:", err.message);
    return res.status(500).send("Webhook processing failed");
  }
};
