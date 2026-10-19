import { http } from "./client.js";

export const login = (body) => http.post("/auth/login", body).then((res) => res.data);
export const register = (body) => http.post("/auth/register", body).then((res) => res.data);
export const getCurrentUser = () => http.get("/auth/me").then((res) => res.data.user);
export const logout = () => http.post("/auth/logout");

let refreshPromise = null;
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = http
      .post("/auth/refresh")
      .then((res) => res.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
