import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemeMode, type ThemePreset } from '../store/themeStore';
import { useT } from '../i18n/useT';

const PRESETS: { key: ThemePreset; labelKey: string; color: string }[] = [
  { key: 'default', labelKey: 'theme.presets.default', color: '#6366f1' },
  { key: 'emerald', labelKey: 'theme.presets.emerald', color: '#10b981' },
  { key: 'amber', labelKey: 'theme.presets.amber', color: '#f59e0b' },
  { key: 'rose', labelKey: 'theme.presets.rose', color: '#f43f5e' },
  { key: 'slate', labelKey: 'theme.presets.slate', color: '#64748b' },
];

export default function ThemeToggle() {
  const { mode, preset, setMode, setPreset } = useThemeStore();
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
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1a] shadow-lg py-2 z-50 animate-scale-in">

          {/* Mode buttons */}
          <div className="px-3 mb-2">
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {themes.map(({ key, icon: ItemIcon, label }) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setOpen(false); }}
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
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

          {/* Preset color dots */}
          <div className="px-3 pt-2 pb-0.5">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 px-1">{t('theme.preset')}</p>
            <div className="flex items-center justify-center gap-2">
              {PRESETS.map(({ key, labelKey, color }) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  title={t(labelKey)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                    preset === key
                      ? 'ring-2 ring-offset-2 ring-slate-300 dark:ring-offset-[#1a1a1a] dark:ring-slate-600'
                      : 'hover:scale-110'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
