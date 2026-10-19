import { pool } from "../config/db.js";

const createScreen = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Screen name is required" });
    }

    const [theatres] = await pool.query(
      "SELECT theatre_id FROM theatres WHERE theatre_id = ?",
      [theatreId],
    );

    if (!theatres.length) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    const [result] = await pool.query(
      "INSERT INTO screens (theatre_id, name) VALUES (?, ?)",
      [theatreId, name.trim()],
    );

    return res.status(201).json({
      message: "Screen created successfully",
      screenId: result.insertId,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This screen name already exists in the theatre",
      });
    }
    console.error("Create screen:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getScreensByTheatre = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM screens
       WHERE theatre_id = ? ORDER BY screen_id`,
      [req.params.theatreId],
    );

    return res.status(200).json({ screens: rows });
  } catch (err) {
    console.error("Get screens:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getScreenById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, t.name AS theatre_name
       FROM screens s
       JOIN theatres t ON t.theatre_id = s.theatre_id
       WHERE s.screen_id = ?`,
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Screen not found" });
    }

    return res.status(200).json({ screen: rows[0] });
  } catch (err) {
    console.error("Get screen:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateScreen = async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Screen name is required" });
    }

    const [result] = await pool.query(
      "UPDATE screens SET name = ? WHERE screen_id = ?",
      [name.trim(), req.params.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Screen not found" });
    }

    return res.status(200).json({ message: "Screen updated successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Screen name already exists" });
    }
    console.error("Update screen:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteScreen = async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM screens WHERE screen_id = ?",
      [req.params.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Screen not found" });
    }

    return res.status(200).json({ message: "Screen deleted successfully" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Cannot delete a screen with seats or shows",
      });
    }
    console.error("Delete screen:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createScreen,
  getScreensByTheatre,
  getScreenById,
  updateScreen,
  deleteScreen,
};
