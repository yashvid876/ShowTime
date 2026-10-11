import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      city: null,
      cityModalOpen: false,
      setCity: (city) => set({ city, cityModalOpen: false }),
      openCityModal: () => set({ cityModalOpen: true }),
      closeCityModal: () => set({ cityModalOpen: false }),
    }),
    { name: 'mtbs.ui', partialize: (s) => ({ city: s.city }) },
  ),
);
