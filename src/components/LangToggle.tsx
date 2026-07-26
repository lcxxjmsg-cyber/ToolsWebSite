import { Globe } from 'lucide-react';
import { useLang } from '../i18n/useT';

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'zh-CN' ? 'en' : 'zh-CN')}
      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title={lang === 'zh-CN' ? 'Switch to English' : '切换到中文'}
    >
      <Globe className="w-3.5 h-3.5" />
      {lang === 'zh-CN' ? 'EN' : '中'}
    </button>
  );
}
