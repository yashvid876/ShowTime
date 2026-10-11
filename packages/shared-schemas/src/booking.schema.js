import { z } from "zod";

export const BookingStatus = z.enum(["Pending", "Locked", "Booked", "Cancelled", "Failed", "Expired"]);

export const AmountBreakdown = z.object({
  ticketTotal: z.number().int(),
  taxes: z.number().int(),
  convenienceFee: z.number().int(),
  grandTotal: z.number().int(),
  currency: z.string(),
});

export const LockBody = z.object({
  showId: z.string().length(24),
  seatIds: z.array(z.string().length(24)).min(1).max(10),
});

export const Booking = z.object({
  id: z.string(),
  showId: z.string(),
  status: BookingStatus,
  seats: z.array(z.object({ id: z.string(), row: z.string(), col: z.number(), category: z.string() })),
  amountBreakdown: AmountBreakdown,
  qrPayload: z.string().optional(),
  createdAt: z.string(),
  show: z.object({
    movieTitle: z.string(),
    venueName: z.string(),
    screenName: z.string(),
    startTime: z.string(),
  }),
});

/** @typedef {z.infer<typeof LockBody>} LockBodyT */
