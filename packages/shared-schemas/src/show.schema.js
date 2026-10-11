import { z } from "zod";

export const SeatStatus = z.enum(["available", "locked", "booked"]);

export const Seat = z.object({
  id: z.string(),
  row: z.string(),
  col: z.number().int(),
  category: z.string(),
  price: z.number().int(),
  status: SeatStatus,
});

export const MovieCard = z.object({
  id: z.string(),
  type: z.enum(["movie", "event"]),
  title: z.string(),
  posterUrl: z.string().optional(),
  genre: z.array(z.string()),
  language: z.array(z.string()),
  duration: z.number(),
  rating: z.string().optional(),
  avgRating: z.number().optional(),
});

export const Availability = z.enum(["AVAILABLE", "FILLING_FAST", "SOLD_OUT"]);

export const ShowSummary = z.object({
  id: z.string(),
  startTime: z.string(),
  format: z.string().optional(),
  screenName: z.string(),
  priceFrom: z.number().int(),
  availability: Availability,
});

export const ShowsByVenue = z.array(
  z.object({
    venue: z.object({ id: z.string(), name: z.string(), city: z.string() }),
    shows: z.array(ShowSummary),
  }),
);
