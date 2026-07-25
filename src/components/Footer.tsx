import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';

const FOOTER_LINKS = [
  { to: '/faq', label: 'FAQ' },
  { to: '/privacy', label: '隐私协议' },
  { to: '/terms', label: '使用条款' },
];

const FEEDBACK_EMAIL = 'mailto:anony.neatly471@passfwd.com';

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-black text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              ImageToolbox
            </span>
          </div>

          <p className="text-sm text-slate-400 mb-6">
            图片处理工具箱 · 所有处理均在浏览器本地完成
          </p>

          <nav className="flex items-center gap-6 mb-8">
            {FOOTER_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
            <a
              href={FEEDBACK_EMAIL}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              反馈
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            © 2026 ImageToolbox. 永久免费 · 本地处理 · 隐私安全
          </p>
        </div>
      </div>
    </footer>
  );
}
