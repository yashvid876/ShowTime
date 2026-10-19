import { http } from "./client.js";

export const createBooking = (showId, seatIds) =>
  http.post("/bookings", { showId, seatIds }).then((res) => res.data);

export const getBookings = (page = 1) =>
  http
    .get("/bookings/mine", { params: { page, limit: 20 } })
    .then((res) => res.data);

export const getBooking = (id) =>
  http.get(`/bookings/${id}`).then((res) => res.data.booking);

export const getBookingStatus = (id) =>
  http.get(`/bookings/${id}/status`).then((res) => res.data);

export const releaseBooking = (id) => http.delete(`/bookings/${id}/release`);

export const initiatePayment = (bookingId) =>
  http
    .post("/payments/initiate", { bookingId })
    .then((res) => res.data);

export const verifyPayment = (data) =>
  http.post("/bookings/verify-payment", data).then((res) => res.data);

export const getPaymentStatus = (bookingId) =>
  http.get(`/payments/${bookingId}`).then((res) => res.data);
