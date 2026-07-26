import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'default' | 'emerald' | 'amber' | 'rose' | 'slate';

interface ThemeStore {
  mode: ThemeMode;
  preset: ThemePreset;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
}

const PRESET_COLORS: Record<ThemePreset, { light: Record<string, string>; dark: Record<string, string> }> = {
  default: {
    light: { '--color-accent': '#6366f1', '--color-accent-hover': '#4f46e5' },
    dark: { '--color-accent': '#818cf8', '--color-accent-hover': '#6366f1' },
  },
  emerald: {
    light: { '--color-accent': '#10b981', '--color-accent-hover': '#059669' },
    dark: { '--color-accent': '#34d399', '--color-accent-hover': '#10b981' },
  },
  amber: {
    light: { '--color-accent': '#f59e0b', '--color-accent-hover': '#d97706' },
    dark: { '--color-accent': '#fbbf24', '--color-accent-hover': '#f59e0b' },
  },
  rose: {
    light: { '--color-accent': '#f43f5e', '--color-accent-hover': '#e11d48' },
    dark: { '--color-accent': '#fb7185', '--color-accent-hover': '#f43f5e' },
  },
  slate: {
    light: { '--color-accent': '#64748b', '--color-accent-hover': '#475569' },
    dark: { '--color-accent': '#94a3b8', '--color-accent-hover': '#64748b' },
  },
};

function applyTheme(mode: ThemeMode, preset: ThemePreset) {
  const root = document.documentElement;
  const resolved = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  root.classList.toggle('dark', resolved === 'dark');

  const colors = PRESET_COLORS[preset][resolved];
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(key, value);
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: (localStorage.getItem('ppic_theme_mode') as ThemeMode) || 'system',
  preset: (localStorage.getItem('ppic_theme_preset') as ThemePreset) || 'default',
  resolvedMode: 'light',

  setMode: (mode: ThemeMode) => {
    localStorage.setItem('ppic_theme_mode', mode);
    const { preset } = get();
    applyTheme(mode, preset);
    set({ mode });
  },

  setPreset: (preset: ThemePreset) => {
    localStorage.setItem('ppic_theme_preset', preset);
    const { mode } = get();
    applyTheme(mode, preset);
    set({ preset });
  },
}));

const initMode = (localStorage.getItem('ppic_theme_mode') as ThemeMode) || 'system';
const initPreset = (localStorage.getItem('ppic_theme_preset') as ThemePreset) || 'default';
applyTheme(initMode, initPreset);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { mode, preset } = useThemeStore.getState();
  if (mode === 'system') applyTheme('system', preset);
});
