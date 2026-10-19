import express from "express";

/* File Imports */
import { getHealth } from "../controllers/healthController.js";

const router = express.Router();

router.get("/health", getHealth);

export default router;
