import { z } from "zod";

export const PaymentStatus = z.enum(["Locked", "Pending", "Booked", "Failed", "Expired"]);
export const InitiateBody = z.object({ bookingId: z.string().length(24) });
export const InitiateResponse = z.object({
  orderId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  keyId: z.string(),
});
