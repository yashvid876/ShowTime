import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";

/* File Imports */
import healthRoutes from "./routes/healthRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import theatreRoutes from "./routes/theatreRoutes.js";
import screenRoutes from "./routes/screenRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import showRoutes from "./routes/showRoutes.js";
import seatLockRoutes from "./routes/seatLockRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { handleRazorpayWebhook } from "./controllers/webhookController.js";
import { redisClient } from "./config/redis.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parses incoming payloads with JSON payloads
// Position of middlewares MATTERS !
app.post(
  "/api/bookings/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRoutes);
app.use("/api", protectedRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", movieRoutes);
app.use("/api", theatreRoutes);
app.use("/api", screenRoutes);
app.use("/api", seatRoutes);
app.use("/api", showRoutes);
app.use("/api/seat-locks", seatLockRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

const startServer = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exitCode = 1;
  }
};

startServer();
