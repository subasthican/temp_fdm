/**
 * Terminal binding store (client state) — which store + register this
 * terminal operates as. Set at the register-select screen after login;
 * every sale and cash session is stamped with it. Persisted so the
 * binding survives reloads (a till stays a till).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRegisterStore = create(
  persist(
    (set) => ({
      store: null, // { id, name, code }
      register: null, // { id, code, name, receiptPrefix }

      setBinding: ({ store, register }) => set({ store, register }),

      clearBinding: () => set({ store: null, register: null }),
    }),
    { name: 'pos-register-binding' },
  ),
);

export default useRegisterStore;
