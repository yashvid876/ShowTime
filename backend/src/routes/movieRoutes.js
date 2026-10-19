import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  createMovie,
  getAllMovies,
  getMovieById,
  getCities,
  getRecommendations,
  updateMovie,
  deleteMovie,
} from "../controllers/movieController.js";

const router = express.Router();

router.post("/movies", authMiddleware, roleMiddleware(["admin"]), createMovie);
router.get("/cities", getCities);
router.get("/recommendations", getRecommendations);
router.get("/movies", getAllMovies);
router.get("/movies/:id", getMovieById);
router.put(
  "/movies/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateMovie,
);
router.delete(
  "/movies/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteMovie,
);

export default router;
