import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Image, Shield, Menu, X, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import { useT } from '../i18n/useT';

const NAV_LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/workspace', key: 'nav.workspace' },
  { to: '/faq', key: 'nav.faq' },
];

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl bg-white/70 dark:bg-[#0f0f0f]/70 border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Image className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              批图网
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('header.privacy')}</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ to, key }) => (
              <Link
                key={to}
                to={to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-1">
            <a href="mailto:anony.neatly471@passfwd.com" title={t('header.feedback')} className="p-2 text-slate-500 hover:text-brand-500 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <LangToggle />
            <ThemeToggle />
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <a href="mailto:anony.neatly471@passfwd.com" title={t('header.feedback')} className="p-2 text-slate-500 hover:text-brand-500 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <LangToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200/50 dark:border-slate-800/50 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('header.privacy')}</span>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, key }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t(key)}
                </Link>
              ))}
            </nav>

          </div>
        </div>
      )}
    </header>
  );
}
