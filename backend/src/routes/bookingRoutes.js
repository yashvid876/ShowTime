import express from "express";
import {
  createBooking,
  verifyPayment,
  getBooking,
  getBookingStatus,
  listMyBookings,
  releaseBooking,
} from "../controllers/bookingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/lock", authMiddleware, createBooking);
router.get("/mine", authMiddleware, listMyBookings);
router.delete("/:id/release", authMiddleware, releaseBooking);
router.get("/:id/status", authMiddleware, getBookingStatus);
router.get("/:id", authMiddleware, getBooking);
router.post("/", authMiddleware, createBooking);
router.post("/verify-payment", authMiddleware, verifyPayment);

export default router;
