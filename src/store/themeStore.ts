import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'imagetoolbox-theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'system';
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage not available
  }
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
}

function applyThemeClass(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const initialTheme = getStoredTheme();
const initialResolved = resolveTheme(initialTheme);

if (typeof document !== 'undefined') {
  applyThemeClass(initialResolved);
}

// Listen for system preference changes
if (
  typeof window !== 'undefined' &&
  window.matchMedia
) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      const resolved = resolveTheme('system');
      useThemeStore.setState({ resolvedTheme: resolved });
      applyThemeClass(resolved);
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // Safari < 14 fallback
    mediaQuery.addListener(handleChange);
  }
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  resolvedTheme: initialResolved,

  setTheme: (theme: Theme) => {
    const resolved = resolveTheme(theme);
    storeTheme(theme);
    applyThemeClass(resolved);
    set({ theme, resolvedTheme: resolved });
  },
}));
