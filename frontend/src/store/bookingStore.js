import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Holds the active seat lock so the checkout countdown survives a refresh.
 * The server is authoritative: `lockExpiresAt` always comes from POST /bookings/lock.
 */
export const useBookingStore = create(
  persist(
    (set) => ({
      lock: null, // { bookingId, showId, seats[], lockExpiresAt, amountBreakdown }
      setLock: (lock) => set({ lock }),
      clearLock: () => set({ lock: null }),
    }),
    { name: 'mtbs.lock', storage: createJSONStorage(() => sessionStorage) },
  ),
);

export const isLockActive = (lock) => !!lock && new Date(lock.lockExpiresAt).getTime() > Date.now();
