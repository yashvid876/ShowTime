import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  createSeats,
  getSeatsByScreen,
  updateSeat,
  deleteSeat,
} from "../controllers/seatController.js";

const router = express.Router();
const admin = [authMiddleware, roleMiddleware(["admin"])];

router.post("/screens/:screenId/seats", ...admin, createSeats);
router.get("/screens/:screenId/seats", getSeatsByScreen);
router.put("/seats/:id", ...admin, updateSeat);
router.delete("/seats/:id", ...admin, deleteSeat);

export default router;
