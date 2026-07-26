import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { useT } from '../i18n/useT';

export default function Footer() {
  const t = useT();

  const FOOTER_LINKS: { to: string; labelKey: string }[] = [
    { to: '/faq', labelKey: 'footer.faq' },
    { to: '/privacy', labelKey: 'footer.privacy' },
    { to: '/terms', labelKey: 'footer.terms' },
  ];

  const FEEDBACK_EMAIL = 'mailto:anony.neatly471@passfwd.com';
  return (
    <footer className="bg-slate-900 dark:bg-black text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              {t('footer.brand')}
            </span>
          </div>

          <p className="text-sm text-slate-400 mb-6">
            {t('footer.tagline')}
          </p>

          <nav className="flex items-center gap-6 mb-8">
            {FOOTER_LINKS.map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t(labelKey)}
              </Link>
            ))}
            <a
              href={FEEDBACK_EMAIL}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t('footer.feedback')}
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            © 2026 {t('footer.brand')}. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
