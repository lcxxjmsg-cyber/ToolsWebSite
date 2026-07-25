import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type Theme } from '../store/themeStore';

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
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

  const themes: { key: Theme; icon: typeof Sun; label: string }[] = [
    { key: 'light', icon: Sun, label: '浅色' },
    { key: 'dark', icon: Moon, label: '深色' },
    { key: 'system', icon: Monitor, label: '跟随系统' },
  ];

  const current = themes.find((t) => t.key === theme) ?? themes[2];
  const Icon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        aria-label="切换主题"
      >
        <Icon className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1a] shadow-lg py-1 z-50 animate-scale-in">
          {themes.map(({ key, icon: ItemIcon, label }) => (
            <button
              key={key}
              onClick={() => {
                setTheme(key);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                theme === key
                  ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ItemIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
