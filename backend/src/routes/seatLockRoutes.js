import express from "express";
import {
  acquireSeatLock,
  releaseSeatLock,
} from "../controllers/seatLockController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:showId/lock", authMiddleware, acquireSeatLock);

router.delete("/:showId/lock/:seatId", authMiddleware, releaseSeatLock);

export default router;
