import { z } from "zod";

export const ReviewBody = z.object({
  movieEventId: z.string().length(24),
  rating: z.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().max(1000, "Keep it under 1000 characters").optional(),
});

export const Review = z.object({
  id: z.string(),
  rating: z.number().int(),
  comment: z.string().optional(),
  createdAt: z.string(),
});
