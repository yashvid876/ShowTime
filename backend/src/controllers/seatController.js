import { pool } from "../config/db.js";

const createSeats = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { screenId } = req.params;
    const { seats } = req.body;
    const allowedTypes = ["regular", "premium", "recliner"];

    if (!Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ message: "A non-empty seats array is required" });
    }

    for (const seat of seats) {
      if (
        typeof seat.row_label !== "string" ||
        !/^[A-Z]{1,5}$/.test(seat.row_label) ||
        !Number.isInteger(seat.seat_number) ||
        seat.seat_number < 1 ||
        !allowedTypes.includes(seat.seat_type ?? "regular")
      ) {
        return res.status(400).json({ message: "Invalid seat data" });
      }
    }

    await connection.beginTransaction();
    const createdSeatIds = [];

    const [screens] = await connection.query(
      "SELECT screen_id FROM screens WHERE screen_id = ? FOR UPDATE",
      [screenId],
    );

    if (!screens.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Screen not found" });
    }

    for (const seat of seats) {
      const [result] = await connection.query(
        `INSERT INTO seats (screen_id, row_label, seat_number, seat_type)
         VALUES (?, ?, ?, ?)`,
        [
          screenId,
          seat.row_label,
          seat.seat_number,
          seat.seat_type ?? "regular",
        ],
      );
      createdSeatIds.push(result.insertId);
    }

    // Seat maps and bookings use show_seats, so extend generated future inventories too.
    const [showsWithInventory] = await connection.query(
      `SELECT DISTINCT sh.show_id, sh.base_price
       FROM shows sh
       JOIN show_seats ss ON ss.show_id = sh.show_id
       WHERE sh.screen_id = ?
         AND sh.status = 'scheduled'
         AND sh.start_time > NOW()`,
      [screenId],
    );
    const newShowSeats = showsWithInventory.flatMap((show) =>
      createdSeatIds.map((seatId) => [show.show_id, seatId, show.base_price]),
    );
    if (newShowSeats.length) {
      await connection.query(
        `INSERT INTO show_seats (show_id, seat_id, price) VALUES ?`,
        [newShowSeats],
      );
    }

    await connection.query(
      `UPDATE screens
       SET total_seats = (
         SELECT COUNT(*) FROM seats WHERE screen_id = ? AND is_active = TRUE
       )
       WHERE screen_id = ?`,
      [screenId, screenId],
    );

    await connection.commit();

    return res.status(201).json({
      message: "Seats created successfully",
      count: seats.length,
    });
  } catch (err) {
    await connection.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A seat with that row and number already exists",
      });
    }

    console.error("Create seats:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const getSeatsByScreen = async (req, res) => {
  try {
    const [screens] = await pool.query(
      "SELECT screen_id FROM screens WHERE screen_id = ?",
      [req.params.screenId],
    );

    if (!screens.length) {
      return res.status(404).json({ message: "Screen not found" });
    }

    const [rows] = await pool.query(
      `SELECT seat_id, screen_id, row_label, seat_number, seat_type, is_active
       FROM seats WHERE screen_id = ?
       ORDER BY row_label, seat_number`,
      [req.params.screenId],
    );

    return res.status(200).json({ seats: rows });
  } catch (err) {
    console.error("Get seats:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateSeat = async (req, res) => {
  try {
    const { seat_type, is_active } = req.body;
    const allowedTypes = ["regular", "premium", "recliner"];

    if (
      (seat_type !== undefined && !allowedTypes.includes(seat_type)) ||
      (is_active !== undefined && typeof is_active !== "boolean") ||
      (seat_type === undefined && is_active === undefined)
    ) {
      return res.status(400).json({ message: "Invalid seat update fields" });
    }

    const [seats] = await pool.query(
      "SELECT screen_id FROM seats WHERE seat_id = ?",
      [req.params.id],
    );

    if (!seats.length) {
      return res.status(404).json({ message: "Seat not found" });
    }

    const assignments = [];
    const values = [];

    if (seat_type !== undefined) {
      assignments.push("seat_type = ?");
      values.push(seat_type);
    }

    if (is_active !== undefined) {
      assignments.push("is_active = ?");
      values.push(is_active);
    }

    values.push(req.params.id);

    await pool.query(
      `UPDATE seats SET ${assignments.join(", ")} WHERE seat_id = ?`,
      values,
    );

    await pool.query(
      `UPDATE screens SET total_seats = (
         SELECT COUNT(*) FROM seats WHERE screen_id = ? AND is_active = TRUE
       ) WHERE screen_id = ?`,
      [seats[0].screen_id, seats[0].screen_id],
    );

    return res.status(200).json({ message: "Seat updated successfully" });
  } catch (err) {
    console.error("Update seat:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteSeat = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT screen_id FROM seats WHERE seat_id = ?",
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Seat not found" });
    }

    try {
      await pool.query("DELETE FROM seats WHERE seat_id = ?", [req.params.id]);
    } catch (err) {
      if (err.code !== "ER_ROW_IS_REFERENCED_2") throw err;

      // Preserve show and booking history, but remove the seat from active maps.
      await pool.query("UPDATE seats SET is_active = FALSE WHERE seat_id = ?", [
        req.params.id,
      ]);
    }

    await pool.query(
      `UPDATE screens SET total_seats = (
         SELECT COUNT(*) FROM seats WHERE screen_id = ? AND is_active = TRUE
       ) WHERE screen_id = ?`,
      [rows[0].screen_id, rows[0].screen_id],
    );

    return res
      .status(200)
      .json({ message: "Seat removed from active inventory" });
  } catch (err) {
    console.error("Delete seat:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createSeats, getSeatsByScreen, updateSeat, deleteSeat };
