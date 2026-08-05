import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useSEO } from '../../utils/seo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode((code - 65 + 13) % 26 + 65);
    if (code >= 97 && code <= 122) return String.fromCharCode((code - 97 + 13) % 26 + 97);
    return c;
  });
}

function rot47(s: string): string {
  return s.replace(/[\x21-\x7e]/g, (c) => {
    const code = c.charCodeAt(0);
    return String.fromCharCode((code - 33 + 47) % 94 + 33);
  });
}

export default function RotTool() {
  const t = useT();

  useSEO({
    title: 'ROT13加解密 - 批图网 | 在线凯撒密码ROT13/ROT47工具',
    description: '免费在线ROT13/ROT47凯撒密码加解密工具，纯本地处理不上传服务器，保护您的隐私安全。',
    keywords: 'rot13,凯撒密码,rot47,在线加解密,rot加密',
  });
  const navigate = useNavigate();
  const [mode, setMode] = useState<'rot13' | 'rot47'>('rot13');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  function handleConvert() {
    if (!input) { setOutput(''); return; }
    setOutput(mode === 'rot13' ? rot13(input) : rot47(input));
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  function handleSwap() {
    setInput(output);
    setOutput('');
    setCopied(false);
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
              <RefreshCw className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('rot.title')}</h1>
              <p className="text-sm text-slate-500">{t('rot.subtitle')}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setMode('rot13'); setOutput(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'rot13' ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>ROT13</button>
            <button onClick={() => { setMode('rot47'); setOutput(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'rot47' ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>ROT47</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('rot.input')}</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
              placeholder={t('rot.input.placeholder')} />
          </div>

          <div className="flex gap-2">
            <button onClick={handleConvert} disabled={!input} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {t('rot.convert')}
            </button>
            <button onClick={handleSwap} disabled={!output} title={t('rot.swap')} className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('rot.output')}</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <textarea readOnly value={output} rows={5}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono resize-none" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
