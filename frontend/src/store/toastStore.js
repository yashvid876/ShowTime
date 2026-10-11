import { create } from 'zustand';

let nextId = 1;
export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (tone, message, ms = 5000) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, tone, message }] });
    if (ms) setTimeout(() => get().dismiss(id), ms);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m) => useToastStore.getState().push('success', m),
  error: (m) => useToastStore.getState().push('error', m, 7000),
  info: (m) => useToastStore.getState().push('info', m),
};
