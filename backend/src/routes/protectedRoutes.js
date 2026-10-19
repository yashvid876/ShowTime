import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getProtectedData } from "../controllers/protectedController.js";

const router = express.Router();

router.get("/protected", authMiddleware, getProtectedData);

export default router;
