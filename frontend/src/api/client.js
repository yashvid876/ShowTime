import axios from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import { normalizeError } from './errors';

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // refresh-token cookie
  timeout: 20000,
});

// Separate instance without interceptors so refresh can never recurse.
const bare = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: 20000 });

const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/resend-otp', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

let refreshPromise = null;
/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = bare
      .post('/auth/refresh')
      .then((res) => {
        const token = res.data?.data?.accessToken;
        if (!token) throw new Error('No access token in refresh response');
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original && NO_REFRESH.some((p) => original.url?.startsWith(p));
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

/** Contract §0.1: success bodies are `{ success: true, data }`. */
export const unwrap = (res) => res.data?.data;

/** Drop empty filter values so they are not sent as `?genre=`. */
export function cleanParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}
