import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const http = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
});

let accessToken = null;
let refreshPromise = null;
let authExpiredHandler = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function setAuthExpiredHandler(handler) {
  authExpiredHandler = handler;
}

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthEndpoint = /^\/auth\/(login|register|refresh|logout)/.test(
      request?.url || "",
    );

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    request._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/auth/refresh")
          .then(({ data }) => {
            if (!data.accessToken) {
              throw new Error("The refresh response did not include an access token.");
            }
            setAccessToken(data.accessToken);
            return data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const token = await refreshPromise;
      request.headers.Authorization = `Bearer ${token}`;
      return http(request);
    } catch (refreshError) {
      clearAccessToken();
      authExpiredHandler?.();
      return Promise.reject(refreshError);
    }
  },
);

export function apiMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) {
    return "Unable to reach ShowTime. Check that the backend is running and try again.";
  }

  const { status, data } = error.response;
  if (status >= 500) return "The server could not complete your request. Please try again.";
  return data?.message || fallback;
}
