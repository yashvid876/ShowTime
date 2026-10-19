import { pool } from "../config/db.js";

const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      duration_minutes,
      language,
      release_date,
      genre,
      poster_url,
      status,
    } = req.body;

    // Validate required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isInteger(duration_minutes) ||
      duration_minutes <= 0 ||
      typeof language !== "string" ||
      !language.trim() ||
      typeof genre !== "string" ||
      !genre.trim()
    ) {
      return res.status(400).json({
        message:
          "Title, positive duration_minutes, language, and genre are required",
      });
    }

    // Validate status if provided
    const allowedStatuses = ["upcoming", "now_showing", "ended"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid movie status",
      });
    }

    // Insert movie
    const [result] = await pool.query(
      `INSERT INTO movies
       (title, description, duration_minutes, language,
        release_date, genre, poster_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description ?? null,
        duration_minutes,
        language.trim(),
        release_date || null,
        genre.trim(),
        poster_url || null,
        status ?? "upcoming",
      ],
    );

    return res.status(201).json({
      message: "Movie created successfully",
      movieId: result.insertId,
    });
  } catch (err) {
    console.error("Create movie error:", err.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllMovies = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const offset = (Math.max(page, 1) - 1) * limit;
    const { city, genre, language, date, q } = req.query;
    const conditions = [];
    const params = [];

    if (typeof q === "string" && q.trim()) {
      conditions.push("m.title LIKE ?");
      params.push(`%${q.trim()}%`);
    }
    if (typeof genre === "string" && genre.trim()) {
      conditions.push("FIND_IN_SET(?, REPLACE(m.genre, ', ', ',')) > 0");
      params.push(genre.trim());
    }
    if (typeof language === "string" && language.trim()) {
      conditions.push("FIND_IN_SET(?, REPLACE(m.language, ', ', ',')) > 0");
      params.push(language.trim());
    }
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      conditions.push(`EXISTS (
        SELECT 1 FROM shows sh
        WHERE sh.movie_id = m.movie_id
          AND sh.status = 'scheduled'
          AND sh.start_time > NOW()
          AND DATE(sh.start_time) = ?
      )`);
      params.push(date);
    }
    if (typeof city === "string" && city.trim()) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM shows sh
        JOIN screens sc ON sc.screen_id = sh.screen_id
        JOIN theatres t ON t.theatre_id = sc.theatre_id
        WHERE sh.movie_id = m.movie_id
          AND sh.status = 'scheduled'
          AND sh.start_time > NOW()
          AND t.city = ?
      )`);
      params.push(city.trim());
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [[count]] = await pool.query(
      `SELECT COUNT(*) AS total FROM movies m ${where}`,
      params,
    );
    const [rows] = await pool.query(
      `SELECT m.* FROM movies m ${where}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      movies: rows,
      total: Number(count.total),
      page: Math.max(page, 1),
      limit,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMovieById = async (req, res) => {
  try {
    const showFilters = [];
    const showParams = [req.params.id];
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const date = typeof req.query.date === "string" ? req.query.date.trim() : "";

    if (city) {
      showFilters.push(" AND t.city = ?");
      showParams.push(city);
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Date must use YYYY-MM-DD" });
      }
      showFilters.push(" AND DATE(sh.start_time) = ?");
      showParams.push(date);
    }

    const [rows] = await pool.query("SELECT * FROM movies WHERE movie_id = ?", [
      req.params.id,
    ]);

    if (!rows.length) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const [shows] = await pool.query(
      `SELECT sh.*, sc.name AS screen_name, t.theatre_id, t.name AS theatre_name,
              t.city,
              (SELECT COUNT(*) FROM show_seats ss
               WHERE ss.show_id = sh.show_id AND ss.status = 'available') AS available_seats,
              (SELECT COUNT(*) FROM show_seats ss
               WHERE ss.show_id = sh.show_id) AS total_seats
       FROM shows sh
       JOIN screens sc ON sc.screen_id = sh.screen_id
       JOIN theatres t ON t.theatre_id = sc.theatre_id
       WHERE sh.movie_id = ?
         AND sh.status = 'scheduled'
         AND sh.start_time > NOW()
         ${showFilters.join("")}
       ORDER BY sh.start_time`,
      showParams,
    );

    return res.status(200).json({ movie: rows[0], shows: shows });
  } catch (err) {
    console.error("Get movie:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCities = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT city AS name FROM theatres WHERE city IS NOT NULL AND city <> '' ORDER BY city",
    );
    return res.status(200).json({ items: rows });
  } catch (err) {
    console.error("Get cities:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const [rows] = await pool.query(
      `SELECT m.*
       FROM movies m
       WHERE (? = '' OR EXISTS (
         SELECT 1
         FROM shows sh
         JOIN screens sc ON sc.screen_id = sh.screen_id
         JOIN theatres t ON t.theatre_id = sc.theatre_id
         WHERE sh.movie_id = m.movie_id
           AND sh.status = 'scheduled'
           AND sh.start_time > NOW()
           AND t.city = ?
       ))
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [city, city],
    );
    return res.status(200).json({ items: rows });
  } catch (err) {
    console.error("Get recommendations:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      duration_minutes,
      language,
      release_date,
      genre,
      poster_url,
      status,
    } = req.body;

    // Validate required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isInteger(duration_minutes) ||
      duration_minutes <= 0 ||
      typeof language !== "string" ||
      !language.trim() ||
      typeof genre !== "string" ||
      !genre.trim()
    ) {
      return res.status(400).json({
        message:
          "Title, positive duration_minutes, language, and genre are required",
      });
    }

    const allowedStatuses = ["upcoming", "now_showing", "ended"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid movie status",
      });
    }

    // Check whether the movie exists
    const [existingMovies] = await pool.query(
      "SELECT movie_id FROM movies WHERE movie_id = ?",
      [id],
    );

    if (existingMovies.length === 0) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    // Update the movie
    await pool.query(
      `UPDATE movies
       SET title = ?,
           description = ?,
           duration_minutes = ?,
           language = ?,
           release_date = ?,
           genre = ?,
           poster_url = ?,
           status = ?
       WHERE movie_id = ?`,
      [
        title.trim(),
        description ?? null,
        duration_minutes,
        language.trim(),
        release_date || null,
        genre.trim(),
        poster_url || null,
        status ?? "upcoming",
        id,
      ],
    );

    return res.status(200).json({
      message: "Movie updated successfully",
    });
  } catch (err) {
    console.error("Update movie error:", err.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM movies WHERE movie_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      message: "Movie deleted successfully",
    });
  } catch (err) {
    console.error("Delete movie error:", err.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export {
  createMovie,
  getAllMovies,
  getMovieById,
  getCities,
  getRecommendations,
  updateMovie,
  deleteMovie,
};
