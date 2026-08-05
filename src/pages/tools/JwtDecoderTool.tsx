import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ShieldCheck } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useSEO } from '../../utils/seo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

function base64UrlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}

function parseJwt(token: string): { header: string; payload: string; signature: string } | string {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return 'Invalid JWT format';
  try {
    return {
      header: JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2),
      payload: JSON.stringify(JSON.parse(base64UrlDecode(parts[1])), null, 2),
      signature: parts[2],
    };
  } catch { return 'Invalid JWT encoding'; }
}

export default function JwtDecoderTool() {
  const t = useT();

  useSEO({
    title: 'JWT解析 - 批图网 | 在线JWT令牌解码验证工具',
    description: '免费在线JWT令牌解析与验证工具，解码Header、Payload与Signature，纯本地处理不上传服务器。',
    keywords: 'jwt,jwt解析,jwt解码,jwt验证,在线jwt',
  });
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ header: string; payload: string; signature: string } | null>(null);
  const [error, setError] = useState('');
  const [copiedH, setCopiedH] = useState(false);
  const [copiedP, setCopiedP] = useState(false);

  function handleDecode() {
    setError('');
    setResult(null);
    if (!input.trim()) return;
    const r = parseJwt(input);
    if (typeof r === 'string') { setError(r); return; }
    setResult(r);
  }

  function handleCopy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => { setter(true); setTimeout(() => setter(false), 2000); }).catch(() => {});
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
              <ShieldCheck className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('jwt.title')}</h1>
              <p className="text-sm text-slate-500">{t('jwt.subtitle')}</p>
            </div>
          </div>

          <div>
            <textarea value={input} onChange={(e) => { setInput(e.target.value); setResult(null); setError(''); }} rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
              placeholder={t('jwt.input.placeholder')} />
          </div>

          <button onClick={handleDecode} disabled={!input.trim()} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {t('jwt.decode')}
          </button>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

          {result && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('jwt.header')}</span>
                  <button onClick={() => handleCopy(result.header, setCopiedH)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    {copiedH ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copiedH ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono break-all whitespace-pre-wrap">{result.header}</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('jwt.payload')}</span>
                  <button onClick={() => handleCopy(result.payload, setCopiedP)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    {copiedP ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copiedP ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono break-all whitespace-pre-wrap">{result.payload}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('jwt.signature')}</span>
                <div className="w-full mt-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-500 font-mono break-all select-all">{result.signature}</div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
