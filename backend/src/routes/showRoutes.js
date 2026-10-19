import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  createShow,
  getAllShows,
  getShowById,
  updateShow,
  cancelShow,
  generateShowSeats,
  getShowSeatAvailability,
} from "../controllers/showController.js";

const router = express.Router();
const admin = [authMiddleware, roleMiddleware(["admin"])];

router.post("/shows", ...admin, createShow);
router.get("/shows", getAllShows);
router.get("/shows/:id", getShowById);
router.put("/shows/:id", ...admin, updateShow);
router.patch("/shows/:id/cancel", ...admin, cancelShow);
router.post(
  "/shows/:id/seats/generate",
  authMiddleware,
  roleMiddleware(["admin"]),
  generateShowSeats,
);
router.get("/shows/:id/seats", getShowSeatAvailability);
router.get("/shows/:id/seatmap", getShowSeatAvailability);

export default router;
