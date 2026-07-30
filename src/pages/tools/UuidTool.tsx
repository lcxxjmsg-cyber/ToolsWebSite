import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Fingerprint, RefreshCw } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function UuidTool() {
  const t = useT();
  const navigate = useNavigate();
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function generate() {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(crypto.randomUUID());
    }
    setUuids(result);
    setCopied(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(uuids.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
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
              <Fingerprint className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('uuid.title')}</h1>
              <p className="text-sm text-slate-500">{t('uuid.subtitle')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('uuid.count')}</label>
            <input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <button onClick={generate} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />{t('uuid.generate')}
          </button>

          {uuids.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('uuid.output')}</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="space-y-1.5">
                {uuids.map((uuid, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-6 text-right flex-shrink-0">{i + 1}.</span>
                    <code className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono select-all">{uuid}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
