import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useThemeStore, type ThemeMode, type ThemeStyle } from '../store/themeStore';
import { useT } from '../i18n/useT';

interface ThemePreview {
  key: ThemeStyle;
  labelKey: string;
  previewColors: { bg: string; card: string; accent: string; text: string; textSec: string };
}

const THEME_PREVIEWS: ThemePreview[] = [
  {
    key: 'default',
    labelKey: 'theme.default',
    previewColors: { bg: '#ffffff', card: '#f8fafc', accent: '#6366f1', text: '#0f172a', textSec: '#94a3b8' },
  },
  {
    key: 'ios',
    labelKey: 'theme.ios',
    previewColors: { bg: '#f2f2f7', card: '#ffffff', accent: '#007aff', text: '#1c1c1e', textSec: '#8e8e93' },
  },
  {
    key: 'neon',
    labelKey: 'theme.neon',
    previewColors: { bg: '#0a0a0f', card: '#1a1a2e', accent: '#00ff88', text: '#e0e0ff', textSec: '#8888aa' },
  },
  {
    key: 'warm',
    labelKey: 'theme.warm',
    previewColors: { bg: '#fff5f5', card: '#ffffff', accent: '#ff6b8a', text: '#4a2c2c', textSec: '#8b6b6b' },
  },
  {
    key: 'minimal',
    labelKey: 'theme.minimal',
    previewColors: { bg: '#ffffff', card: '#fafafa', accent: '#171717', text: '#171717', textSec: '#737373' },
  },
];

export default function ThemeToggle() {
  const { mode, style, setMode, setStyle } = useThemeStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: 'light', icon: Sun, label: t('theme.light') },
    { key: 'dark', icon: Moon, label: t('theme.dark') },
    { key: 'system', icon: Monitor, label: t('theme.system') },
  ];

  const current = themes.find((item) => item.key === mode) ?? themes[2];
  const Icon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        aria-label={t('theme.ariaLabel')}
      >
        <Icon className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1a] shadow-lg p-3 z-50 animate-scale-in">

          {/* Mode buttons */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mb-3">
            {themes.map(({ key, icon: ItemIcon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title={label}
              >
                <ItemIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Style label */}
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 px-1">{t('theme.style')}</p>

          {/* Theme style preview cards */}
          <div className="grid grid-cols-2 gap-2">
            {THEME_PREVIEWS.map(({ key, labelKey, previewColors }) => (
              <button
                key={key}
                onClick={() => setStyle(key)}
                className={`relative text-left rounded-lg border-2 p-1.5 transition-all hover:scale-[1.03] ${
                  style === key
                    ? 'border-brand-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Selection checkmark */}
                {style === key && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Mini preview mockup */}
                <div className="rounded overflow-hidden" style={{ backgroundColor: previewColors.bg }}>
                  {/* Header bar (bg-secondary / card color) */}
                  <div className="h-2.5 mx-1 mt-1 rounded-sm" style={{ backgroundColor: previewColors.card }} />
                  {/* Content area with accent block */}
                  <div className="flex gap-1 px-1 py-1">
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="h-1 rounded-sm" style={{ backgroundColor: previewColors.textSec, width: '70%' }} />
                      <div className="h-1 rounded-sm" style={{ backgroundColor: previewColors.textSec, width: '50%' }} />
                    </div>
                    <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: previewColors.accent }} />
                  </div>
                </div>

                {/* Label */}
                <p className={`text-[10px] font-medium mt-1 text-center truncate ${
                  style === key ? 'text-brand-500' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {t(labelKey)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
