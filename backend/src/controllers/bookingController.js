import crypto from "crypto";
import { pool } from "../config/db.js";
import { razorpay } from "../config/razorpay.js";
import { redisClient } from "../config/redis.js";
import { releaseSeat } from "../utils/seatLock.js";

const lockKey = (showId, seatId) => `seat-lock:show-${showId}:seat-${seatId}`;
const LOCK_TTL_SECONDS = 600;

const publicBookingStatus = (status) => {
  if (status === "confirmed" || status === "booked") return "Booked";
  if (status === "cancelled") return "Cancelled";
  if (status === "failed") return "Failed";
  return "Pending";
};

const releaseOwnedSeatLocks = async (showId, seatIds, userId) => {
  for (const seatId of seatIds) {
    try {
      await releaseSeat(showId, seatId, userId);
    } catch (err) {
      console.error("Release failed booking lock:", err.message);
    }
  }
};

export const createBooking = async (req, res) => {
  const connection = await pool.getConnection();
  let bookingId;
  let committed = false;
  const ownedLocks = [];

  try {
    const userId = req.user.id;
    const { showId, seatIds } = req.body;
    const normalizedSeatIds = Array.isArray(seatIds) ? seatIds.map(Number) : [];

    if (
      !showId ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0 ||
      seatIds.length > 10 ||
      normalizedSeatIds.some((id) => !Number.isInteger(id) || id <= 0) ||
      new Set(normalizedSeatIds).size !== seatIds.length
    ) {
      return res.status(400).json({
        message: "Provide showId and between 1 and 10 unique seatIds",
      });
    }

    await connection.beginTransaction();

    const [shows] = await connection.execute(
      `SELECT show_id, status
       FROM shows
       WHERE show_id = ? AND start_time > NOW()
       FOR UPDATE`,
      [showId],
    );

    if (!shows.length || shows[0].status !== "scheduled") {
      await connection.rollback();
      await releaseOwnedSeatLocks(showId, normalizedSeatIds, userId);
      return res.status(400).json({
        message: "Show is unavailable",
      });
    }

    const placeholders = normalizedSeatIds.map(() => "?").join(",");

    const [seats] = await connection.execute(
      `SELECT show_seat_id, seat_id, price, status
       FROM show_seats
       WHERE show_id = ?
         AND seat_id IN (${placeholders})
       FOR UPDATE`,
      [showId, ...normalizedSeatIds],
    );

    if (
      seats.length !== normalizedSeatIds.length ||
      seats.some((seat) => seat.status !== "available")
    ) {
      await connection.rollback();
      await releaseOwnedSeatLocks(showId, normalizedSeatIds, userId);
      return res.status(409).json({
        message: "One or more seats are unavailable",
      });
    }

    const showSeatPlaceholders = seats.map(() => "?").join(",");
    const [activeAssignments] = await connection.execute(
      `SELECT bs.show_seat_id
       FROM booking_seats bs
       JOIN bookings b ON b.booking_id = bs.booking_id
       WHERE bs.active_show_seat_id IN (${showSeatPlaceholders})
         AND b.status IN ('pending', 'confirmed')
       LIMIT 1`,
      seats.map((seat) => seat.show_seat_id),
    );

    if (activeAssignments.length) {
      await connection.rollback();
      await releaseOwnedSeatLocks(showId, normalizedSeatIds, userId);
      return res.status(409).json({
        message: "One or more seats are already assigned to an active booking",
      });
    }

    // Acquire all seat locks before creating the booking. Roll back acquired
    // locks if any seat is held by another patron.
    for (const seat of seats) {
      const key = lockKey(showId, seat.seat_id);
      const acquired = await redisClient.set(key, String(userId), {
        NX: true,
        EX: LOCK_TTL_SECONDS,
      });
      const owner =
        acquired === "OK" ? String(userId) : await redisClient.get(key);

      if (owner !== String(userId)) {
        await connection.rollback();
        await releaseOwnedSeatLocks(showId, ownedLocks, userId);
        ownedLocks.length = 0;
        return res.status(409).json({
          message: "One or more seats are temporarily held by another customer",
        });
      }
      ownedLocks.push(seat.seat_id);
    }

    const totalAmount = seats.reduce(
      (sum, seat) => sum + Number(seat.price),
      0,
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      await connection.rollback();
      await releaseOwnedSeatLocks(showId, normalizedSeatIds, userId);
      ownedLocks.length = 0;
      return res.status(400).json({
        message: "Invalid booking amount",
      });
    }

    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings
       (user_id, show_id, total_amount, status)
       VALUES (?, ?, ?, 'pending')`,
      [userId, showId, totalAmount],
    );

    bookingId = bookingResult.insertId;

    for (const seat of seats) {
      await connection.execute(
        `INSERT INTO booking_seats
         (booking_id, show_seat_id, active_show_seat_id, price)
         VALUES (?, ?, ?, ?)`,
        [bookingId, seat.show_seat_id, seat.show_seat_id, seat.price],
      );
    }

    const amountPaise = Math.round(totalAmount * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: String(bookingId),
        userId: String(userId),
      },
    });

    await connection.execute(
      `UPDATE bookings
       SET stripe_session_id = ?
       WHERE booking_id = ?`,
      [order.id, bookingId],
    );

    const [seatDetails] = await connection.execute(
      `SELECT s.seat_id, s.row_label, s.seat_number, s.seat_type, bs.price
       FROM booking_seats bs
       JOIN show_seats ss ON ss.show_seat_id = bs.show_seat_id
       JOIN seats s ON s.seat_id = ss.seat_id
       WHERE bs.booking_id = ?
       ORDER BY s.row_label, s.seat_number`,
      [bookingId],
    );

    await connection.commit();
    committed = true;

    return res.status(201).json({
      bookingId,
      showId: Number(showId),
      status: "Locked",
      seats: seatDetails.map((seat) => ({
        id: Number(seat.seat_id),
        row: String(seat.row_label),
        col: Number(seat.seat_number),
        category: seat.seat_type,
        price: Math.round(Number(seat.price) * 100),
      })),
      lockExpiresAt: new Date(
        Date.now() + LOCK_TTL_SECONDS * 1000,
      ).toISOString(),
      amountBreakdown: {
        ticketTotal: amountPaise,
        taxes: 0,
        convenienceFee: 0,
        grandTotal: amountPaise,
        currency: "INR",
      },
      amount: amountPaise,
      currency: "INR",
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    await connection.rollback().catch(() => {});
    if (!committed) {
      await releaseOwnedSeatLocks(
        req.body.showId,
        Array.isArray(req.body.seatIds)
          ? req.body.seatIds.map(Number)
          : ownedLocks,
        req.user.id,
      );
    }
    console.error("Create booking error:", err.message);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "One or more seats were just booked. Please choose again.",
      });
    }

    return res.status(500).json({
      message: "Failed to create booking",
    });
  } finally {
    connection.release();
  }
};

const bookingDetailsQuery = `
  SELECT b.booking_id, b.show_id, b.total_amount, b.status, b.created_at,
         sh.start_time, m.title AS movie_title, t.name AS venue_name,
         sc.name AS screen_name
  FROM bookings b
  JOIN shows sh ON sh.show_id = b.show_id
  JOIN movies m ON m.movie_id = sh.movie_id
  JOIN screens sc ON sc.screen_id = sh.screen_id
  JOIN theatres t ON t.theatre_id = sc.theatre_id
`;

const getBookingSeats = async (bookingId) => {
  const [rows] = await pool.execute(
    `SELECT s.seat_id, s.row_label, s.seat_number, s.seat_type, bs.price
     FROM booking_seats bs
     JOIN show_seats ss ON ss.show_seat_id = bs.show_seat_id
     JOIN seats s ON s.seat_id = ss.seat_id
     WHERE bs.booking_id = ?
     ORDER BY s.row_label, s.seat_number`,
    [bookingId],
  );
  return rows.map((seat) => ({
    id: Number(seat.seat_id),
    row: String(seat.row_label),
    col: Number(seat.seat_number),
    category: seat.seat_type,
    price: Math.round(Number(seat.price) * 100),
  }));
};

const getBooking = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `${bookingDetailsQuery}
       WHERE b.booking_id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id],
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const row = rows[0];
    const amount = Math.round(Number(row.total_amount) * 100);
    return res.status(200).json({
      booking: {
        id: Number(row.booking_id),
        showId: Number(row.show_id),
        status: publicBookingStatus(row.status),
        seats: await getBookingSeats(row.booking_id),
        amountBreakdown: {
          ticketTotal: amount,
          taxes: 0,
          convenienceFee: 0,
          grandTotal: amount,
          currency: "INR",
        },
        createdAt: new Date(row.created_at).toISOString(),
        show: {
          movieTitle: row.movie_title,
          venueName: row.venue_name,
          screenName: row.screen_name,
          startTime: new Date(row.start_time).toISOString(),
        },
      },
    });
  } catch (err) {
    console.error("Get booking:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBookingStatus = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT status FROM bookings WHERE booking_id = ? AND user_id = ?`,
      [req.params.id, req.user.id],
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json({
      status: publicBookingStatus(rows[0].status),
    });
  } catch (err) {
    console.error("Get booking status:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const listMyBookings = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      50,
    );
    const status = req.query.status;
    const statusClause =
      status === "Upcoming"
        ? "AND b.status IN ('pending', 'confirmed') AND sh.start_time > NOW()"
        : status === "Completed"
          ? "AND b.status = 'confirmed' AND sh.start_time <= NOW()"
          : status === "Cancelled"
            ? "AND b.status IN ('cancelled', 'failed', 'expired')"
            : "";
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM bookings b JOIN shows sh ON sh.show_id = b.show_id
       WHERE b.user_id = ? ${statusClause}`,
      [req.user.id],
    );
    const [rows] = await pool.execute(
      `${bookingDetailsQuery}
       WHERE b.user_id = ? ${statusClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, (page - 1) * limit],
    );
    const items = await Promise.all(
      rows.map(async (row) => {
        const amount = Math.round(Number(row.total_amount) * 100);
        return {
          id: Number(row.booking_id),
          showId: Number(row.show_id),
          status: publicBookingStatus(row.status),
          seats: await getBookingSeats(row.booking_id),
          amountBreakdown: {
            ticketTotal: amount,
            taxes: 0,
            convenienceFee: 0,
            grandTotal: amount,
            currency: "INR",
          },
          createdAt: new Date(row.created_at).toISOString(),
          show: {
            movieTitle: row.movie_title,
            venueName: row.venue_name,
            screenName: row.screen_name,
            startTime: new Date(row.start_time).toISOString(),
          },
        };
      }),
    );
    return res
      .status(200)
      .json({ items, total: Number(countRows[0].total), page, limit });
  } catch (err) {
    console.error("List bookings:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const releaseBooking = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [bookings] = await connection.execute(
      `SELECT booking_id, show_id, status
       FROM bookings WHERE booking_id = ? AND user_id = ? FOR UPDATE`,
      [req.params.id, req.user.id],
    );
    if (!bookings.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Booking not found" });
    }
    const booking = bookings[0];
    if (booking.status !== "pending") {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "Booking can no longer be released" });
    }
    const [seats] = await connection.execute(
      `SELECT ss.seat_id FROM booking_seats bs
       JOIN show_seats ss ON ss.show_seat_id = bs.show_seat_id
       WHERE bs.booking_id = ?`,
      [booking.booking_id],
    );
    await connection.execute(
      "UPDATE booking_seats SET active_show_seat_id = NULL WHERE booking_id = ?",
      [booking.booking_id],
    );
    await connection.execute(
      "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?",
      [booking.booking_id],
    );
    await connection.commit();
    for (const seat of seats) {
      await releaseSeat(booking.show_id, seat.seat_id, req.user.id);
    }
    return res.status(204).end();
  } catch (err) {
    await connection.rollback().catch(() => {});
    console.error("Release booking:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }
    const [rows] = await pool.execute(
      `SELECT stripe_session_id, total_amount, status
       FROM bookings WHERE booking_id = ? AND user_id = ?`,
      [bookingId, req.user.id],
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const booking = rows[0];
    if (booking.status !== "pending" || !booking.stripe_session_id) {
      return res
        .status(409)
        .json({ message: "Booking is not awaiting payment" });
    }
    return res.status(200).json({
      orderId: booking.stripe_session_id,
      amount: Math.round(Number(booking.total_amount) * 100),
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Initiate payment:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPayment = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT status FROM bookings WHERE booking_id = ? AND user_id = ?`,
      [req.params.bookingId, req.user.id],
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json({
      status: publicBookingStatus(rows[0].status),
      receiptUrl: null,
    });
  } catch (err) {
    console.error("Get payment:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Missing payment verification fields",
      });
    }

    const [bookings] = await pool.execute(
      `SELECT booking_id, user_id, total_amount, status,
              stripe_session_id
       FROM bookings
       WHERE booking_id = ? AND user_id = ?`,
      [bookingId, userId],
    );

    if (!bookings.length) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const booking = bookings[0];

    if (booking.stripe_session_id !== razorpay_order_id) {
      return res.status(400).json({
        message: "Order does not match booking",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const supplied = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      supplied.length !== expected.length ||
      !crypto.timingSafeEqual(supplied, expected)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // Verify the payment status with Razorpay's API as well.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      Number(payment.amount) !== Math.round(Number(booking.total_amount) * 100)
    ) {
      return res.status(409).json({
        message:
          "Captured payment amount or currency does not match the booking",
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [lockedBookings] = await connection.execute(
        `SELECT booking_id, status, show_id, user_id
         FROM bookings
         WHERE booking_id = ? AND user_id = ?
         FOR UPDATE`,
        [bookingId, userId],
      );

      if (!lockedBookings.length) {
        await connection.rollback();
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      const lockedBooking = lockedBookings[0];
      if (
        lockedBooking.status !== "pending" &&
        lockedBooking.status !== "confirmed"
      ) {
        await connection.rollback();
        return res.status(409).json({
          message: "Booking is no longer pending",
        });
      }

      const [bookingSeats] = await connection.execute(
        `SELECT bs.show_seat_id, ss.seat_id, ss.show_id, ss.status
         FROM booking_seats bs
         JOIN show_seats ss
           ON ss.show_seat_id = bs.show_seat_id
         WHERE bs.booking_id = ?
         FOR UPDATE`,
        [bookingId],
      );

      if (!bookingSeats.length) {
        await connection.rollback();
        return res
          .status(409)
          .json({ message: "Booking has no assigned seats" });
      }

      if (lockedBooking.status === "pending") {
        if (bookingSeats.some((seat) => seat.status !== "available")) {
          await connection.rollback();
          return res.status(409).json({
            message: "Seat inventory is no longer available",
          });
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
          [...bookingSeats.map((seat) => seat.show_seat_id), bookingId],
        );
        if (otherActiveAssignments.length) {
          await connection.rollback();
          return res.status(409).json({
            message: "Seat inventory is assigned to another active booking",
          });
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
          [bookingId],
        );
      }

      await connection.commit();

      await releaseOwnedSeatLocks(
        lockedBooking.show_id,
        bookingSeats.map((seat) => seat.seat_id),
        userId,
      );

      return res.status(200).json({
        message:
          lockedBooking.status === "confirmed"
            ? "Booking already confirmed"
            : "Payment verified and booking confirmed",
        bookingId,
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Verify payment error:", err.message);
    return res.status(500).json({
      message: "Payment verification failed",
    });
  }
};

export {
  getBooking,
  getBookingStatus,
  listMyBookings,
  releaseBooking,
  initiatePayment,
  getPayment,
};
