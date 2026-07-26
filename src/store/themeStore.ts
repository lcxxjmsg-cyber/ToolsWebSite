import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'default' | 'ios' | 'neon' | 'warm' | 'minimal';

interface ThemeVars {
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-card': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--border-color': string;
  '--accent': string;
  '--accent-hover': string;
  '--radius': string;
  '--radius-lg': string;
  '--shadow-sm': string;
  '--shadow-md': string;
  '--shadow-lg': string;
  '--glass-bg': string;
  '--glass-border': string;
  '--glass-blur': string;
  '--font': string;
}

const THEMES: Record<ThemeStyle, { light: ThemeVars; dark: ThemeVars }> = {
  default: {
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--bg-card': '#ffffff',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--border-color': '#e2e8f0',
      '--accent': '#6366f1',
      '--accent-hover': '#4f46e5',
      '--radius': '12px',
      '--radius-lg': '16px',
      '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
      '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.07)',
      '--shadow-lg': '0 10px 25px -3px rgba(0,0,0,0.1)',
      '--glass-bg': 'rgba(255,255,255,0.7)',
      '--glass-border': 'rgba(255,255,255,0.3)',
      '--glass-blur': '12px',
      '--font': '"Inter", "SF Pro Display", "PingFang SC", system-ui, sans-serif',
    },
    dark: {
      '--bg-primary': '#0f0f0f',
      '--bg-secondary': '#1a1a1a',
      '--bg-card': '#1a1a1a',
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--border-color': '#334155',
      '--accent': '#818cf8',
      '--accent-hover': '#6366f1',
      '--radius': '12px',
      '--radius-lg': '16px',
      '--shadow-sm': '0 1px 2px rgba(0,0,0,0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0,0,0,0.4)',
      '--shadow-lg': '0 10px 25px -3px rgba(0,0,0,0.5)',
      '--glass-bg': 'rgba(26,26,26,0.7)',
      '--glass-border': 'rgba(51,65,85,0.5)',
      '--glass-blur': '12px',
      '--font': '"Inter", "SF Pro Display", "PingFang SC", system-ui, sans-serif',
    },
  },
  ios: {
    light: {
      '--bg-primary': '#f2f2f7',
      '--bg-secondary': '#ffffff',
      '--bg-card': '#ffffff',
      '--text-primary': '#1c1c1e',
      '--text-secondary': '#8e8e93',
      '--border-color': '#e5e5ea',
      '--accent': '#007aff',
      '--accent-hover': '#0062cc',
      '--radius': '18px',
      '--radius-lg': '24px',
      '--shadow-sm': '0 1px 3px rgba(0,0,0,0.04)',
      '--shadow-md': '0 4px 12px rgba(0,0,0,0.06)',
      '--shadow-lg': '0 8px 30px rgba(0,0,0,0.08)',
      '--glass-bg': 'rgba(255,255,255,0.85)',
      '--glass-border': 'rgba(0,0,0,0.04)',
      '--glass-blur': '20px',
      '--font': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    },
    dark: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#1c1c1e',
      '--bg-card': '#1c1c1e',
      '--text-primary': '#ffffff',
      '--text-secondary': '#aeaeb2',
      '--border-color': '#38383a',
      '--accent': '#0a84ff',
      '--accent-hover': '#409cff',
      '--radius': '18px',
      '--radius-lg': '24px',
      '--shadow-sm': 'none',
      '--shadow-md': 'none',
      '--shadow-lg': 'none',
      '--glass-bg': 'rgba(28,28,30,0.85)',
      '--glass-border': 'rgba(255,255,255,0.08)',
      '--glass-blur': '20px',
      '--font': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    },
  },
  neon: {
    light: {
      '--bg-primary': '#0a0a0f',
      '--bg-secondary': '#12121a',
      '--bg-card': '#1a1a2e',
      '--text-primary': '#e0e0ff',
      '--text-secondary': '#8888aa',
      '--border-color': '#2a2a4a',
      '--accent': '#00ff88',
      '--accent-hover': '#00cc66',
      '--radius': '4px',
      '--radius-lg': '8px',
      '--shadow-sm': '0 0 10px rgba(0,255,136,0.1)',
      '--shadow-md': '0 0 20px rgba(0,255,136,0.15)',
      '--shadow-lg': '0 0 40px rgba(0,255,136,0.2)',
      '--glass-bg': 'rgba(18,18,26,0.8)',
      '--glass-border': 'rgba(0,255,136,0.15)',
      '--glass-blur': '16px',
      '--font': '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    },
    dark: {
      '--bg-primary': '#0a0a0f',
      '--bg-secondary': '#12121a',
      '--bg-card': '#1a1a2e',
      '--text-primary': '#e0e0ff',
      '--text-secondary': '#8888aa',
      '--border-color': '#2a2a4a',
      '--accent': '#00ff88',
      '--accent-hover': '#00cc66',
      '--radius': '4px',
      '--radius-lg': '8px',
      '--shadow-sm': '0 0 10px rgba(0,255,136,0.1)',
      '--shadow-md': '0 0 20px rgba(0,255,136,0.15)',
      '--shadow-lg': '0 0 40px rgba(0,255,136,0.2)',
      '--glass-bg': 'rgba(18,18,26,0.8)',
      '--glass-border': 'rgba(0,255,136,0.15)',
      '--glass-blur': '16px',
      '--font': '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    },
  },
  warm: {
    light: {
      '--bg-primary': '#fff5f5',
      '--bg-secondary': '#ffffff',
      '--bg-card': '#ffffff',
      '--text-primary': '#4a2c2c',
      '--text-secondary': '#8b6b6b',
      '--border-color': '#f0d0d0',
      '--accent': '#ff6b8a',
      '--accent-hover': '#e05570',
      '--radius': '20px',
      '--radius-lg': '28px',
      '--shadow-sm': '0 2px 8px rgba(255,107,138,0.08)',
      '--shadow-md': '0 4px 16px rgba(255,107,138,0.12)',
      '--shadow-lg': '0 8px 32px rgba(255,107,138,0.16)',
      '--glass-bg': 'rgba(255,255,255,0.75)',
      '--glass-border': 'rgba(255,107,138,0.1)',
      '--glass-blur': '16px',
      '--font': '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    dark: {
      '--bg-primary': '#1a1118',
      '--bg-secondary': '#241820',
      '--bg-card': '#2d1a25',
      '--text-primary': '#f5e0e8',
      '--text-secondary': '#b89098',
      '--border-color': '#3d2835',
      '--accent': '#ff6b8a',
      '--accent-hover': '#ff8da5',
      '--radius': '20px',
      '--radius-lg': '28px',
      '--shadow-sm': '0 2px 8px rgba(255,107,138,0.1)',
      '--shadow-md': '0 4px 16px rgba(255,107,138,0.15)',
      '--shadow-lg': '0 8px 32px rgba(255,107,138,0.2)',
      '--glass-bg': 'rgba(45,26,37,0.75)',
      '--glass-border': 'rgba(255,107,138,0.15)',
      '--glass-blur': '16px',
      '--font': '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
  minimal: {
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#fafafa',
      '--bg-card': '#ffffff',
      '--text-primary': '#171717',
      '--text-secondary': '#737373',
      '--border-color': '#e5e5e5',
      '--accent': '#171717',
      '--accent-hover': '#404040',
      '--radius': '0px',
      '--radius-lg': '0px',
      '--shadow-sm': 'none',
      '--shadow-md': 'none',
      '--shadow-lg': 'none',
      '--glass-bg': 'rgba(255,255,255,0.95)',
      '--glass-border': 'rgba(0,0,0,0.06)',
      '--glass-blur': '0px',
      '--font': '"Helvetica Neue", "Arial", sans-serif',
    },
    dark: {
      '--bg-primary': '#0a0a0a',
      '--bg-secondary': '#141414',
      '--bg-card': '#141414',
      '--text-primary': '#ededed',
      '--text-secondary': '#a0a0a0',
      '--border-color': '#333333',
      '--accent': '#ffffff',
      '--accent-hover': '#d4d4d4',
      '--radius': '0px',
      '--radius-lg': '0px',
      '--shadow-sm': 'none',
      '--shadow-md': 'none',
      '--shadow-lg': 'none',
      '--glass-bg': 'rgba(20,20,20,0.95)',
      '--glass-border': 'rgba(255,255,255,0.06)',
      '--glass-blur': '0px',
      '--font': '"Helvetica Neue", "Arial", sans-serif',
    },
  },
};

interface ThemeStore {
  mode: ThemeMode;
  style: ThemeStyle;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return mode;
}

function applyTheme(mode: ThemeMode, style: ThemeStyle) {
  const root = document.documentElement;
  const resolved = resolveMode(mode);
  const vars = THEMES[style][resolved];

  root.classList.toggle('dark', resolved === 'dark');
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: (localStorage.getItem('ppic_theme_mode') as ThemeMode) || 'system',
  style: (localStorage.getItem('ppic_theme_style') as ThemeStyle) || 'default',

  setMode: (mode: ThemeMode) => {
    localStorage.setItem('ppic_theme_mode', mode);
    applyTheme(mode, get().style);
    set({ mode });
  },

  setStyle: (style: ThemeStyle) => {
    localStorage.setItem('ppic_theme_style', style);
    applyTheme(get().mode, style);
    set({ style });
  },
}));

// Init on load
const initMode = (localStorage.getItem('ppic_theme_mode') as ThemeMode) || 'system';
const initStyle = (localStorage.getItem('ppic_theme_style') as ThemeStyle) || 'default';
applyTheme(initMode, initStyle);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { mode, style } = useThemeStore.getState();
  if (mode === 'system') applyTheme('system', style);
});
