import { http } from "./client.js";

export const getAdminDashboard = () =>
  http.get("/admin/dashboard").then((res) => res.data);

export const getAdminMovies = (params = {}) =>
  http.get("/movies", { params }).then((res) => res.data);

export const createMovie = (movie) =>
  http.post("/movies", movie).then((res) => res.data);

export const updateMovie = (id, movie) =>
  http.put(`/movies/${id}`, movie).then((res) => res.data);

export const deleteMovie = (id) =>
  http.delete(`/movies/${id}`).then((res) => res.data);

export const getTheatres = () =>
  http.get("/theatres").then((res) => res.data.theatres || []);

export const createTheatre = (theatre) =>
  http.post("/theatres", theatre).then((res) => res.data);

export const deleteTheatre = (id) =>
  http.delete(`/theatres/${id}`).then((res) => res.data);

export const getScreens = (theatreId) =>
  http
    .get(`/theatres/${theatreId}/screens`)
    .then((res) => res.data.screens || []);

export const createScreen = (theatreId, name) =>
  http
    .post(`/theatres/${theatreId}/screens`, { name })
    .then((res) => res.data);

export const deleteScreen = (id) =>
  http.delete(`/screens/${id}`).then((res) => res.data);

export const getAdminShows = () =>
  http.get("/shows").then((res) => res.data.shows || []);

export const createShow = (show) =>
  http.post("/shows", show).then((res) => res.data);

export const cancelShow = (id) =>
  http.patch(`/shows/${id}/cancel`).then((res) => res.data);

export const generateShowSeats = (id) =>
  http.post(`/shows/${id}/seats/generate`).then((res) => res.data);

export const getPhysicalSeats = (screenId) =>
  http
    .get(`/screens/${screenId}/seats`)
    .then((res) => res.data.seats || []);

export const createPhysicalSeats = (screenId, seats) =>
  http.post(`/screens/${screenId}/seats`, { seats }).then((res) => res.data);

export const updatePhysicalSeat = (seatId, updates) =>
  http.put(`/seats/${seatId}`, updates).then((res) => res.data);

export const deletePhysicalSeat = (seatId) =>
  http.delete(`/seats/${seatId}`).then((res) => res.data);
