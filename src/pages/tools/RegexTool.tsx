import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Brackets } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function RegexTool() {
  const t = useT();
  const navigate = useNavigate();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gm');
  const [testText, setTestText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [replaceResult, setReplaceResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const matches = useMemo(() => {
    if (!pattern || !testText) return [];
    setError('');
    try {
      const re = new RegExp(pattern, flags);
      const results: { index: number; match: string; groups: string[] }[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(testText)) !== null) {
        results.push({ index: m.index, match: m[0], groups: m.slice(1) });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      return results;
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, [pattern, flags, testText]);

  function handleReplace() {
    if (!pattern || !testText) return;
    try {
      const re = new RegExp(pattern, flags);
      setReplaceResult(testText.replace(re, replacement));
      setError('');
    } catch (e) { setError((e as Error).message); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(replaceResult).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />{t('nav.tools')}
        </button>
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Brackets className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('regex.title')}</h1>
              <p className="text-sm text-slate-500">{t('regex.subtitle')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('regex.pattern')}</label>
            <div className="flex gap-2">
              <input value={pattern} onChange={(e) => setPattern(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="/^\\w+$/" />
              <input value={flags} onChange={(e) => setFlags(e.target.value)}
                className="w-16 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-3 py-3 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="gm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('regex.testText')}</label>
            <textarea value={testText} onChange={(e) => setTestText(e.target.value)} rows={6}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
              placeholder={t('regex.testText.placeholder')} />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

          {matches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('regex.matches')} ({matches.length})</label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {matches.map((m, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 mr-2">#{i + 1} @{m.index}</span>
                    <span className="text-sm font-mono text-slate-900 dark:text-white">{m.match}</span>
                    {m.groups.length > 0 && <span className="text-xs text-slate-400 ml-2">groups: {m.groups.join(', ')}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {matches.length === 0 && pattern && !error && testText && (
            <p className="text-sm text-slate-400">{t('regex.noMatch')}</p>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('regex.replace')}</label>
            <div className="flex gap-2">
              <input value={replacement} onChange={(e) => setReplacement(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder={t('regex.replace.placeholder')} />
              <button onClick={handleReplace} disabled={!pattern || !testText} className="px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {t('regex.replaceBtn')}
              </button>
            </div>
            {replaceResult && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('regex.result')}</span>
                  <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono whitespace-pre-wrap break-all">{replaceResult}</div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
