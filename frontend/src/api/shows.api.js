import { http } from "./client.js";

export const getShow = (id) =>
  http.get(`/shows/${id}`).then((res) => res.data.show);

export const getSeatMap = (id) =>
  http.get(`/shows/${id}/seatmap`).then((res) => res.data);

export const acquireSeatLock = (showId, seatId) =>
  http
    .post(`/seat-locks/${showId}/lock`, { seatId })
    .then((res) => res.data);

export const releaseSeatLock = (showId, seatId) =>
  http.delete(`/seat-locks/${showId}/lock/${seatId}`);
