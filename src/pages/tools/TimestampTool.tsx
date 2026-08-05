import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Clock, Calendar, RefreshCw } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useSEO } from '../../utils/seo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TimestampTool() {
  const t = useT();

  useSEO({
    title: '时间戳转换 - 批图网 | 在线Unix时间戳与日期互转工具',
    description: '免费在线Unix时间戳与日期时间互转工具，支持秒级与毫秒级时间戳，纯本地处理不上传服务器。',
    keywords: '时间戳,时间戳转换,unix时间戳,在线时间戳,时间转换工具',
  });
  const navigate = useNavigate();
  const [timestamp, setTimestamp] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));

  function toLocalISO(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function tsToDate() {
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return;
    const d = new Date(ts * 1000);
    if (isNaN(d.getTime())) return;
    setDateStr(toLocalISO(d));
  }

  function dateToTs() {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    setTimestamp(String(Math.floor(d.getTime() / 1000)));
  }

  function setNow() {
    const now = Math.floor(Date.now() / 1000);
    setCurrentTimestamp(now);
    setTimestamp(String(now));
    setDateStr(toLocalISO(new Date()));
  }

  function handleCopyTs() {
    navigator.clipboard.writeText(String(currentTimestamp)).catch(() => {});
  }

  function handleCopyTimestamp() {
    navigator.clipboard.writeText(timestamp).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />{t('nav.tools')}
        </button>

        {/* Current timestamp */}
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('timestamp.title')}</h1>
              <p className="text-sm text-slate-500">{t('timestamp.subtitle')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('timestamp.current')}</label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white select-all">
                {currentTimestamp}
              </div>
              <button onClick={setNow} className="px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />{t('timestamp.refresh')}
              </button>
              <button onClick={handleCopyTs} className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Converter */}
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('timestamp.converter')}</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('timestamp.ts')}</label>
            <div className="flex gap-2">
              <input value={timestamp} onChange={(e) => setTimestamp(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                placeholder="1700000000" />
              <button onClick={tsToDate} disabled={!timestamp} className="px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('timestamp.date')}</label>
            <div className="flex gap-2">
              <input value={dateStr} onChange={(e) => setDateStr(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="2023-11-15T00:00:00" />
              <button onClick={dateToTs} disabled={!dateStr} className="px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>

          {timestamp && dateStr && (
            <div className="flex items-center justify-end">
              <button onClick={handleCopyTimestamp} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Copy className="w-3.5 h-3.5" />{t('common.copy')}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
