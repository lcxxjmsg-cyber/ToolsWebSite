import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, FileDiff } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface DiffPart { type: 'same' | 'add' | 'remove'; text: string }

function lcs(a: string[], b: string[]): string[][] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  }
  const result: string[][] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { result.unshift(['same', a[i - 1]]); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { result.unshift(['add', b[j - 1]]); j--; }
    else { result.unshift(['remove', a[i - 1]]); i--; }
  }
  return result;
}

export default function TextDiffTool() {
  const t = useT();
  const navigate = useNavigate();
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [copied, setCopied] = useState(false);

  const diff = useMemo(() => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const ops = lcs(linesA, linesB);
    return ops.map(([type, text]) => ({ type, text } as DiffPart));
  }, [textA, textB]);

  function handleCopy() {
    const out = diff.map((d) => `${d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' '} ${d.text}`).join('\n');
    navigator.clipboard.writeText(out).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
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
              <FileDiff className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('textdiff.title')}</h1>
              <p className="text-sm text-slate-500">{t('textdiff.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('textdiff.textA')}</label>
              <textarea value={textA} onChange={(e) => setTextA(e.target.value)} rows={8}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('textdiff.textB')}</label>
              <textarea value={textB} onChange={(e) => setTextB(e.target.value)} rows={8}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono" />
            </div>
          </div>

          {(textA || textB) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('textdiff.diff')}</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 max-h-64 overflow-y-auto">
                {diff.map((d, i) => (
                  <div key={i} className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${
                    d.type === 'add' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    d.type === 'remove' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className="select-none mr-1">{d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' '}</span>
                    {d.text}
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
