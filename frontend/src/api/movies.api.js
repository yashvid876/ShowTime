import { http } from "./client.js";

export const getMovies = (params = {}) =>
  http.get("/movies", { params }).then((res) => res.data);

export const getMovie = (id, params = {}) =>
  http.get(`/movies/${id}`, { params }).then((res) => res.data);

export const getCities = () =>
  http.get("/cities").then((res) => res.data.items || []);
