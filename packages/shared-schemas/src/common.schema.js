import { z } from "zod";

/** Success envelope: `{ success: true, data }` (API contract §0.1). */
export const apiSuccess = (schema) => z.object({ success: z.literal(true), data: schema });

export const ApiError = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.any()).optional(),
  }),
});

export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** 24-char hex MongoDB ObjectId. */
export const ObjectId = z.string().length(24);
