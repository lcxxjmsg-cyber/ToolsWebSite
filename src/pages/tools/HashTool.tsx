import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Shield, RefreshCw } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useSEO } from '../../utils/seo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ALGOS = [
  { id: 'SHA-1', label: 'SHA-1' },
  { id: 'SHA-256', label: 'SHA-256' },
  { id: 'SHA-384', label: 'SHA-384' },
  { id: 'SHA-512', label: 'SHA-512' },
];

async function hexDigest(algo: string, text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashTool() {
  const t = useT();

  useSEO({
    title: 'Hash计算 - 批图网 | 在线SHA-1 SHA-256 SHA-512哈希工具',
    description: '免费在线Hash计算工具，支持SHA-1、SHA-256、SHA-384、SHA-512算法，纯本地计算不上传服务器，保护您的数据安全。',
    keywords: 'hash,sha1,sha256,sha512,在线哈希计算,hash生成器',
  });
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [activeAlgo, setActiveAlgo] = useState('SHA-256');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleHash() {
    if (!input) return;
    const hex = await hexDigest(activeAlgo, input);
    setOutput(hex);
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
              <Shield className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('hash.title')}</h1>
              <p className="text-sm text-slate-500">{t('hash.subtitle')}</p>
            </div>
          </div>

          <div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
              placeholder={t('hash.input.placeholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('hash.algo')}</label>
          <div className="flex flex-wrap gap-2">
            {ALGOS.map((algo) => (
                <button key={algo.id} onClick={() => setActiveAlgo(algo.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${activeAlgo === algo.id ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{algo.label}</button>
              ))}
            </div>
          </div>

          <button onClick={handleHash} disabled={!input} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />{t('hash.generate')}
          </button>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{activeAlgo}:</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono break-all select-all">
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
