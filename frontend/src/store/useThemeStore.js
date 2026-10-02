/**
 * Theme (client UI state). Persists the user's choice — 'light', 'dark',
 * or 'system' — and applies it by toggling the `dark` class on <html>.
 * A matching no-flash script in index.html sets the initial class before
 * React mounts, so there is never a light→dark flash on load.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolve = (theme) =>
  theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme;

export const applyTheme = (theme) => {
  const mode = resolve(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      // Flip to the opposite of whatever is currently showing.
      toggleTheme: () => {
        const next = resolve(get().theme) === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'pos-theme',
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? 'system'),
    },
  ),
);

// Follow the OS when the user has chosen 'system'.
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (useThemeStore.getState().theme === 'system') applyTheme('system');
    });
}

export default useThemeStore;
