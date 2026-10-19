import { pool } from "../config/db.js";
import { lockSeat, releaseSeat } from "../utils/seatLock.js";

export const acquireSeatLock = async (req, res) => {
  try {
    const { showId } = req.params;
    const { seatId } = req.body;
    const userId = req.user.id;

    if (!Number.isInteger(Number(seatId)) || Number(seatId) <= 0) {
      return res.status(400).json({
        message: "A valid seatId is required",
      });
    }

    // Confirm that this seat belongs to this show's inventory.
    const [rows] = await pool.execute(
      `SELECT ss.status,
              EXISTS (
                SELECT 1
                FROM booking_seats bs
                JOIN bookings b ON b.booking_id = bs.booking_id
                WHERE bs.active_show_seat_id = ss.show_seat_id
                  AND b.status IN ('pending', 'confirmed')
              ) AS has_active_booking
       FROM show_seats ss
       JOIN shows sh ON sh.show_id = ss.show_id
       WHERE ss.show_id = ? AND ss.seat_id = ?
         AND sh.status = 'scheduled'
         AND sh.start_time > NOW()`,
      [showId, seatId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Seat not found for this show",
      });
    }

    if (rows[0].status !== "available" || Number(rows[0].has_active_booking)) {
      return res.status(409).json({
        message: "Seat is already assigned to an active booking",
      });
    }

    const acquired = await lockSeat(showId, seatId, userId);

    if (!acquired) {
      return res.status(409).json({
        message: "Seat is temporarily locked by another customer",
      });
    }

    return res.status(200).json({
      message: "Seat locked successfully",
      showId: Number(showId),
      seatId: Number(seatId),
      expiresInSeconds: 600,
    });
  } catch (err) {
    console.error("Acquire seat lock error:", err.message);
    return res.status(500).json({
      message: "Failed to lock seat",
    });
  }
};

export const releaseSeatLock = async (req, res) => {
  try {
    const { showId, seatId } = req.params;
    const userId = req.user.id;

    const released = await releaseSeat(showId, seatId, userId);

    if (!released) {
      return res.status(409).json({
        message: "Lock not found or not owned by you",
      });
    }

    return res.status(200).json({
      message: "Seat lock released successfully",
    });
  } catch (err) {
    console.error("Release seat lock error:", err.message);
    return res.status(500).json({
      message: "Failed to release seat lock",
    });
  }
};
