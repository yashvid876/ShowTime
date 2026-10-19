import { pool } from "../config/db.js";

const createTheatre = async (req, res) => {
  try {
    const { name, address, city, pincode } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      typeof city !== "string" ||
      !city.trim()
    ) {
      return res.status(400).json({
        message: "Name, address and city are required",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO theatres (name, address, city, pincode)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), address.trim(), city.trim(), pincode || null],
    );

    return res.status(201).json({
      message: "Theatre created successfully",
      theatreId: result.insertId,
    });
  } catch (err) {
    console.error("Create theatre:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTheatres = async (req, res) => {
  try {
    const { city } = req.query;

    const [rows] = city
      ? await pool.query(
          "SELECT * FROM theatres WHERE city = ? ORDER BY name",
          [city],
        )
      : await pool.query("SELECT * FROM theatres ORDER BY name");

    return res.status(200).json({ theatres: rows });
  } catch (err) {
    console.error("Get theatres:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTheatreById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM theatres WHERE theatre_id = ?",
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    return res.status(200).json({ theatre: rows[0] });
  } catch (err) {
    console.error("Get theatre:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTheatre = async (req, res) => {
  try {
    const { name, address, city, pincode } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      typeof city !== "string" ||
      !city.trim()
    ) {
      return res.status(400).json({
        message: "Name, address and city are required",
      });
    }

    const [result] = await pool.query(
      `UPDATE theatres
       SET name = ?, address = ?, city = ?, pincode = ?
       WHERE theatre_id = ?`,
      [
        name.trim(),
        address.trim(),
        city.trim(),
        pincode || null,
        req.params.id,
      ],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    return res.status(200).json({ message: "Theatre updated successfully" });
  } catch (err) {
    console.error("Update theatre:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTheatre = async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM theatres WHERE theatre_id = ?",
      [req.params.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    return res.status(200).json({ message: "Theatre deleted successfully" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Cannot delete a theatre that has screens or dependent records",
      });
    }
    console.error("Delete theatre:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
};
