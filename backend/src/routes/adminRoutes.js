import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { getAdminDashboard } from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/admin/dashboard",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAdminDashboard,
);

export default router;
