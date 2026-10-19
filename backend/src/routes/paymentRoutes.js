import express from "express";
import {
  getPayment,
  initiatePayment,
} from "../controllers/bookingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initiate", authMiddleware, initiatePayment);
router.get("/:bookingId", authMiddleware, getPayment);

export default router;
