import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Hash } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useSEO } from '../../utils/seo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const BASES = [2, 8, 10, 16];

export default function BaseConvertTool() {
  const t = useT();

  useSEO({
    title: '进制转换 - 批图网 | 在线二进制八进制十进制十六进制转换',
    description: '免费在线进制转换工具，支持二进制、八进制、十进制、十六进制互转，纯本地处理不上传服务器。',
    keywords: '进制转换,二进制转换,十六进制,在线进制转换,进制计算器',
  });
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(2);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function handleConvert() {
    setError('');
    setOutput('');
    if (!input) return;
    try {
      const dec = parseInt(input, fromBase);
      if (isNaN(dec)) { setError(t('baseconvert.error.invalid')); return; }
      setOutput(dec.toString(toBase).toUpperCase());
    } catch {
      setError(t('baseconvert.error.invalid'));
    }
  }

  function handleSwap() {
    const prevOutput = output;
    setFromBase(toBase);
    setToBase(fromBase);
    setInput(prevOutput);
    setOutput('');
    setError('');
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
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
              <Hash className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('baseconvert.title')}</h1>
              <p className="text-sm text-slate-500">{t('baseconvert.subtitle')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('baseconvert.input')}</label>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              placeholder={t('baseconvert.input.placeholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('baseconvert.from')}</label>
              <div className="flex flex-wrap gap-2">
                {BASES.map((b) => (
                  <button key={b} onClick={() => setFromBase(b)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${fromBase === b ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('baseconvert.to')}</label>
              <div className="flex flex-wrap gap-2">
                {BASES.map((b) => (
                  <button key={b} onClick={() => setToBase(b)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${toBase === b ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleConvert} disabled={!input} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {t('baseconvert.convert')}
            </button>
            <button onClick={handleSwap} disabled={!output} title={t('baseconvert.swap')} className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ArrowLeft className="w-4 h-4" /><ArrowLeft className="w-4 h-4 -ml-2" />
            </button>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('baseconvert.output')}</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono break-all">
                {output}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
