import * as authApi from '@/api/auth.api';
import { refreshAccessToken } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';

let bootstrapPromise = null;

/**
 * On first load try to restore the session from the httpOnly refresh cookie:
 * POST /auth/refresh → GET /auth/me. Deduped so React StrictMode can't rotate the token twice.
 */
export function bootstrapAuth() {
  if (!bootstrapPromise) {
    const { setStatus, setSession, clearSession } = useAuthStore.getState();
    setStatus('loading');
    bootstrapPromise = refreshAccessToken()
      .then(async (accessToken) => {
        const user = await authApi.getMe();
        setSession({ accessToken, user });
      })
      .catch(() => clearSession());
  }
  return bootstrapPromise;
}

export async function loginUser(credentials) {
  const { accessToken, user } = await authApi.login(credentials);
  useAuthStore.getState().setSession({ accessToken, user });
  return user;
}

export async function logoutUser(queryClient) {
  try {
    await authApi.logout();
  } catch {
    // Even if the server call fails, the local session must end.
  }
  useAuthStore.getState().clearSession();
  useBookingStore.getState().clearLock();
  queryClient?.clear();
}

export const homeFor = (user) => (user && user.role !== 'patron' ? '/admin' : '/');

/** Only allow same-origin relative redirects. */
export function safeNext(next, fallback = '/') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
