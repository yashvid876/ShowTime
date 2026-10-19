import { pool } from "../config/db.js";

const getAllShows = async (req, res) => {
  try {
    const { movieId, theatreId, date } = req.query;

    let sql = `
      SELECT sh.*, m.title AS movie_title, m.poster_url,
             sc.name AS screen_name, t.theatre_id,
             t.name AS theatre_name, t.city
      FROM shows sh
      JOIN movies m ON m.movie_id = sh.movie_id
      JOIN screens sc ON sc.screen_id = sh.screen_id
      JOIN theatres t ON t.theatre_id = sc.theatre_id
      WHERE sh.status = 'scheduled'
        AND sh.start_time > NOW()
    `;
    const params = [];

    if (movieId) {
      sql += " AND sh.movie_id = ?";
      params.push(movieId);
    }

    if (theatreId) {
      sql += " AND t.theatre_id = ?";
      params.push(theatreId);
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Date must use YYYY-MM-DD" });
      }
      sql += " AND DATE(sh.start_time) = ?";
      params.push(date);
    }

    sql += " ORDER BY sh.start_time";

    const [rows] = await pool.query(sql, params);
    return res.status(200).json({ shows: rows });
  } catch (err) {
    console.error("Get shows:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getShowById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sh.*, m.title AS movie_title, sc.name AS screen_name,
              t.name AS theatre_name, t.address, t.city
       FROM shows sh
       JOIN movies m ON m.movie_id = sh.movie_id
       JOIN screens sc ON sc.screen_id = sh.screen_id
       JOIN theatres t ON t.theatre_id = sc.theatre_id
       WHERE sh.show_id = ?`,
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Show not found" });
    }

    return res.status(200).json({ show: rows[0] });
  } catch (err) {
    console.error("Get show:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createShow = async (req, res) => {
  try {
    const { movie_id, screen_id, start_time, base_price } = req.body;

    if (
      !Number.isInteger(Number(movie_id)) ||
      Number(movie_id) <= 0 ||
      !Number.isInteger(Number(screen_id)) ||
      Number(screen_id) <= 0 ||
      typeof start_time !== "string" ||
      !Number.isFinite(Date.parse(start_time)) ||
      typeof base_price !== "number" ||
      !Number.isFinite(base_price) ||
      base_price < 0
    ) {
      return res.status(400).json({
        message:
          "Valid movie_id, screen_id, start_time and base_price are required",
      });
    }

    const start = new Date(start_time);
    if (start <= new Date()) {
      return res.status(400).json({ message: "Show must start in the future" });
    }

    const [movies] = await pool.query(
      "SELECT duration_minutes FROM movies WHERE movie_id = ?",
      [movie_id],
    );

    if (!movies.length) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const [screens] = await pool.query(
      "SELECT screen_id FROM screens WHERE screen_id = ?",
      [screen_id],
    );

    if (!screens.length) {
      return res.status(404).json({ message: "Screen not found" });
    }

    const durationMs = (movies[0].duration_minutes + 15) * 60 * 1000;
    const end = new Date(start.getTime() + durationMs);

    // Prevent overlapping scheduled shows on the same screen.
    const [conflicts] = await pool.query(
      `SELECT show_id FROM shows
       WHERE screen_id = ?
         AND status = 'scheduled'
         AND start_time < ?
         AND end_time > ?
       LIMIT 1`,
      [screen_id, end, start],
    );

    if (conflicts.length) {
      return res.status(409).json({
        message: "This show overlaps with another scheduled show",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO shows
       (movie_id, screen_id, start_time, end_time, base_price)
       VALUES (?, ?, ?, ?, ?)`,
      [movie_id, screen_id, start, end, base_price],
    );

    return res.status(201).json({
      message: "Show created successfully",
      showId: result.insertId,
      end_time: end,
    });
  } catch (err) {
    console.error("Create show:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateShow = async (req, res) => {
  try {
    const { movie_id, screen_id, start_time, base_price } = req.body;

    if (
      !Number.isInteger(Number(movie_id)) ||
      Number(movie_id) <= 0 ||
      !Number.isInteger(Number(screen_id)) ||
      Number(screen_id) <= 0 ||
      typeof start_time !== "string" ||
      !Number.isFinite(Date.parse(start_time)) ||
      typeof base_price !== "number" ||
      !Number.isFinite(base_price) ||
      base_price < 0
    ) {
      return res.status(400).json({
        message:
          "Valid movie_id, screen_id, start_time and base_price are required",
      });
    }

    const start = new Date(start_time);
    if (start <= new Date()) {
      return res.status(400).json({ message: "Show must start in the future" });
    }

    const [current] = await pool.query(
      "SELECT show_id FROM shows WHERE show_id = ? AND status = 'scheduled'",
      [req.params.id],
    );

    if (!current.length) {
      return res.status(404).json({ message: "Scheduled show not found" });
    }

    const [movies] = await pool.query(
      "SELECT duration_minutes FROM movies WHERE movie_id = ?",
      [movie_id],
    );

    if (!movies.length) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const [screens] = await pool.query(
      "SELECT screen_id FROM screens WHERE screen_id = ?",
      [screen_id],
    );

    if (!screens.length) {
      return res.status(404).json({ message: "Screen not found" });
    }

    const end = new Date(
      start.getTime() + (movies[0].duration_minutes + 15) * 60 * 1000,
    );

    const [conflicts] = await pool.query(
      `SELECT show_id FROM shows
       WHERE screen_id = ?
         AND show_id <> ?
         AND status = 'scheduled'
         AND start_time < ?
         AND end_time > ?
       LIMIT 1`,
      [screen_id, req.params.id, end, start],
    );

    if (conflicts.length) {
      return res.status(409).json({
        message: "This show overlaps with another scheduled show",
      });
    }

    await pool.query(
      `UPDATE shows
       SET movie_id = ?, screen_id = ?, start_time = ?,
           end_time = ?, base_price = ?
       WHERE show_id = ?`,
      [movie_id, screen_id, start, end, base_price, req.params.id],
    );

    return res.status(200).json({ message: "Show updated successfully" });
  } catch (err) {
    console.error("Update show:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const cancelShow = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE shows SET status = 'cancelled'
       WHERE show_id = ? AND status = 'scheduled'`,
      [req.params.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Scheduled show not found",
      });
    }

    return res.status(200).json({ message: "Show cancelled successfully" });
  } catch (err) {
    console.error("Cancel show:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const generateShowSeats = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id: showId } = req.params;

    await connection.beginTransaction();

    // Find the show and lock its row during generation.
    const [shows] = await connection.query(
      `SELECT show_id, screen_id, base_price, status, start_time
       FROM shows
       WHERE show_id = ?
       FOR UPDATE`,
      [showId],
    );

    if (!shows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Show not found" });
    }

    const show = shows[0];

    if (
      show.status !== "scheduled" ||
      new Date(show.start_time) <= new Date()
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: "Inventory can only be generated for a future scheduled show",
      });
    }

    // Prevent duplicate generation.
    const [existing] = await connection.query(
      "SELECT COUNT(*) AS total FROM show_seats WHERE show_id = ?",
      [showId],
    );

    if (Number(existing[0].total) > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Seat inventory already exists for this show",
      });
    }

    // Get every active physical seat belonging to this screen.
    const [seats] = await connection.query(
      `SELECT seat_id
       FROM seats
       WHERE screen_id = ? AND is_active = TRUE
       ORDER BY row_label, seat_number`,
      [show.screen_id],
    );

    if (!seats.length) {
      await connection.rollback();
      return res.status(400).json({
        message: "No active seats found for this screen",
      });
    }

    // Generate one inventory record per physical seat.
    const values = seats.map((seat) => [
      show.show_id,
      seat.seat_id,
      show.base_price,
    ]);

    await connection.query(
      `INSERT INTO show_seats (show_id, seat_id, price)
       VALUES ?`,
      [values],
    );

    await connection.commit();

    return res.status(201).json({
      message: "Show seat inventory generated successfully",
      showId: show.show_id,
      generatedSeats: seats.length,
    });
  } catch (err) {
    await connection.rollback();

    console.error("Generate show seats:", err.message);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Some seat inventory already exists for this show",
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const getShowSeatAvailability = async (req, res) => {
  try {
    const { id: showId } = req.params;

    const [shows] = await pool.query(
      `SELECT show_id, base_price
       FROM shows
       WHERE show_id = ?`,
      [showId],
    );

    if (!shows.length) {
      return res.status(404).json({ message: "Show not found" });
    }

    const [rows] = await pool.query(
      `SELECT
         ss.show_seat_id,
         ss.seat_id,
         CASE
           WHEN ss.status = 'booked'
             OR EXISTS (
               SELECT 1
               FROM booking_seats bs
               JOIN bookings b ON b.booking_id = bs.booking_id
               WHERE bs.active_show_seat_id = ss.show_seat_id
                 AND b.status = 'confirmed'
             ) THEN 'booked'
           WHEN EXISTS (
             SELECT 1
             FROM booking_seats bs
             JOIN bookings b ON b.booking_id = bs.booking_id
             WHERE bs.active_show_seat_id = ss.show_seat_id
               AND b.status = 'pending'
           ) THEN 'locked'
           ELSE ss.status
         END AS status,
         ss.price,
         s.row_label,
         s.seat_number,
         s.seat_type
       FROM show_seats ss
       JOIN seats s ON s.seat_id = ss.seat_id
       WHERE ss.show_id = ?
         AND (
           s.is_active = TRUE
           OR EXISTS (
             SELECT 1
             FROM booking_seats bs
             JOIN bookings b ON b.booking_id = bs.booking_id
             WHERE bs.active_show_seat_id = ss.show_seat_id
               AND b.status IN ('pending', 'confirmed')
           )
         )
       ORDER BY s.row_label, s.seat_number`,
      [showId],
    );

    const seats = rows.map((seat) => ({
      id: Number(seat.seat_id),
      showSeatId: Number(seat.show_seat_id),
      row: String(seat.row_label),
      col: Number(seat.seat_number),
      category: seat.seat_type,
      price: Number(seat.price),
      status: seat.status,
    }));

    return res.status(200).json({
      showId: Number(showId),
      rows: [...new Set(seats.map((seat) => seat.row))].length,
      cols: seats.reduce((max, seat) => Math.max(max, seat.col), 0),
      totalSeats: seats.length,
      pricing: { basePrice: Number(shows[0].base_price) },
      seats,
    });
  } catch (err) {
    console.error("Get show seat availability:", err.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export {
  createShow,
  getAllShows,
  getShowById,
  updateShow,
  cancelShow,
  generateShowSeats,
  getShowSeatAvailability,
};
