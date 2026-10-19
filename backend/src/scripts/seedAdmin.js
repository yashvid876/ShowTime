import { pool } from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdminFunc = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.error("Incomplete request");
      return;
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length > 0) {
      console.error("Email already exists. No changes made.");
      return;
    }
    const hashedPassword = await hashPassword(password);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, "admin"],
    );
    console.log("Admin seeded successfully.");
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedAdminFunc();
