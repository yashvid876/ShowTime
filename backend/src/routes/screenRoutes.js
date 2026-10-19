import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  createScreen,
  getScreensByTheatre,
  getScreenById,
  updateScreen,
  deleteScreen,
} from "../controllers/screenController.js";

const router = express.Router();
const admin = [authMiddleware, roleMiddleware(["admin"])];

router.post("/theatres/:theatreId/screens", ...admin, createScreen);
router.get("/theatres/:theatreId/screens", getScreensByTheatre);
router.get("/screens/:id", getScreenById);
router.put("/screens/:id", ...admin, updateScreen);
router.delete("/screens/:id", ...admin, deleteScreen);

export default router;
