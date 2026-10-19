import { hashPassword, comparePassword } from "../utils/password.js";
import { pool } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import {
  REFRESH_TOKEN_TTL_MS,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/refreshToken.js";

const cookieOptions = {
  maxAge: REFRESH_TOKEN_TTL_MS,
  sameSite: "strict",
  secure: false,
  httpOnly: true,
};

const registerUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Validate input
    if (!email || !name || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    // Destructuring gives the first object of the result, the other might be metadata and other stuff
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length > 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user into database
    const [insertResult] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );

    const userId = insertResult.insertId;

    // Generate JWT
    const token = generateToken(userId);

    // Send response
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        name,
        email,
      },
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body.identifier ?? req.body.email;
    const plaintextPassword = req.body.password;

    if (!email || !plaintextPassword)
      return res.status(400).json({ message: "Missing fields" });

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email],
    );

    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });
    const field = rows[0];
    const { id, name, email: userEmail, password_hash } = field;
    const result = await comparePassword(plaintextPassword, password_hash);
    if (!result)
      return res.status(401).json({ message: "Invalid email or password" });

    const accessToken = generateToken(id);
    const refreshToken = generateRefreshToken();
    await pool.query(
      "INSERT INTO refresh_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [id, hashRefreshToken(refreshToken), getRefreshTokenExpiry()],
    );
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.status(200).json({
      message: "Login success",
      user: {
        id,
        name,
        email: userEmail,
      },
      accessToken,
    });
  } catch (err) {
    console.error(`Error from authController.js ${err.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("Get current user:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({
        message:
          "The refresh credential is missing, invalid, expired, or revoked.",
      });
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const [rows] = await pool.query(
      "SELECT session_id, user_id, expires_at, revoked_at FROM refresh_sessions WHERE token_hash = ? AND revoked_at IS NULL",
      [hashedRefreshToken],
    );

    if (rows.length === 0)
      return res.status(401).json({
        message:
          "The refresh credential is missing, invalid, expired, or revoked.",
      });

    const { session_id, user_id, expires_at } = rows[0];
    if (Date.now() >= new Date(expires_at).getTime()) {
      await pool.query(
        "UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id = ? AND revoked_at IS NULL",
        [session_id],
      );
      return res.status(401).json({
        message:
          "The refresh credential is missing, invalid, expired, or revoked.",
      });
    }

    const [userRows] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [user_id],
    );
    if (userRows.length === 0)
      return res.status(401).json({
        message:
          "The refresh credential is missing, invalid, expired, or revoked.",
      });
    const { id, name, email: userEmail } = userRows[0];

    // Create a new access token
    const accessToken = generateToken(user_id);
    // Create a new refresh token
    const newRefreshToken = generateRefreshToken();
    // Update database with new refresh token
    const [updateResult] = await pool.query(
      "UPDATE refresh_sessions SET token_hash = ?, expires_at = ? WHERE session_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP",
      [
        hashRefreshToken(newRefreshToken),
        getRefreshTokenExpiry(),
        session_id,
        hashedRefreshToken,
      ],
    );

    if (updateResult.affectedRows !== 1) {
      return res.status(401).json({
        message: "Refresh token is invalid or no longer current.",
      });
    }
    // Set cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    return res.status(200).json({
      message: "Token refresh success",
      user: {
        id,
        name,
        email: userEmail,
      },
      accessToken,
    });
  } catch (err) {
    console.log(`Error: ${err.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({
        message:
          "The refresh credential is missing, invalid, expired, or revoked.",
      });

    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const [rows] = await pool.query(
      "SELECT session_id FROM refresh_sessions WHERE token_hash = ? AND revoked_at IS NULL",
      [hashedRefreshToken],
    );

    if (rows.length === 0) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
      return res.status(200).json({
        message: "Logout success",
      });
    }

    const { session_id } = rows[0];
    await pool.query(
      "UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id = ? AND revoked_at IS NULL",
      [session_id],
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return res.status(200).json({ message: "Logout success" });
  } catch (err) {
    console.log(`Error: ${err.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshAccessToken,
  logoutUser,
};
