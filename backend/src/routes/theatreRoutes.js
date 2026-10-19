import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
} from "../controllers/theatreController.js";

const router = express.Router();
const admin = [authMiddleware, roleMiddleware(["admin"])];

router.post("/theatres", ...admin, createTheatre);
router.get("/theatres", getAllTheatres);
router.get("/theatres/:id", getTheatreById);
router.put("/theatres/:id", ...admin, updateTheatre);
router.delete("/theatres/:id", ...admin, deleteTheatre);

export default router;
