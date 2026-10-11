import { create } from 'zustand';

/**
 * Access token lives in memory only (never localStorage) to limit XSS exposure.
 * The refresh token is an httpOnly cookie managed by the server.
 * status: 'idle' (not bootstrapped) | 'loading' | 'authenticated' | 'guest'
 */
export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  status: 'idle',
  setStatus: (status) => set({ status }),
  setSession: ({ accessToken, user }) => set({ accessToken, user, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null, status: 'guest' }),
}));
