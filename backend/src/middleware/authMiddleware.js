import { verifyToken } from "../utils/jwt.js";
import { pool } from "../config/db.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    const [scheme, token] = authHeader?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    let decodedPayload;

    try {
      decodedPayload = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const user_id = decodedPayload.userId;

    const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [
      user_id,
    ]);

    if (rows.length === 0)
      return res.status(401).json({ message: "User not found" });

    const { id, role } = rows[0];
    req.user = { id, role };

    next();
  } catch (err) {
    console.log(`Error: ${err.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { authMiddleware };
