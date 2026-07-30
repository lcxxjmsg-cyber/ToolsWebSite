import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Key, RefreshCw } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function PasswordTool() {
  const t = useT();
  const navigate = useNavigate();
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  function generate() {
    let chars = '';
    if (includeUpper) chars += UPPER;
    if (includeLower) chars += LOWER;
    if (includeDigits) chars += DIGITS;
    if (includeSymbols) chars += SYMBOLS;
    if (!chars) { setPassword(''); return; }
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[arr[i] % chars.length];
    }
    setPassword(result);
    setCopied(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(password).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
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
              <Key className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('password.title')}</h1>
              <p className="text-sm text-slate-500">{t('password.subtitle')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('password.length')}: {length}</label>
            <input type="range" min={4} max={128} value={length} onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full accent-violet-500" />
            <div className="flex justify-between text-xs text-slate-400"><span>4</span><span>128</span></div>
          </div>

          <div className="space-y-2">
            {[
              { label: t('password.upper'), val: includeUpper, set: includeUpper, key: 'upper' },
              { label: t('password.lower'), val: includeLower, set: includeLower, key: 'lower' },
              { label: t('password.digits'), val: includeDigits, set: includeDigits, key: 'digits' },
              { label: t('password.symbols'), val: includeSymbols, set: includeSymbols, key: 'symbols' },
            ].map(({ label, val, key }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={val} onChange={() => {
                  const count = [includeUpper, includeLower, includeDigits, includeSymbols].filter(Boolean).length;
                  if (!val && count <= 1) return;
                  if (key === 'upper') setIncludeUpper(!val);
                  if (key === 'lower') setIncludeLower(!val);
                  if (key === 'digits') setIncludeDigits(!val);
                  if (key === 'symbols') setIncludeSymbols(!val);
                }} className="rounded border-slate-300 dark:border-slate-700 text-violet-500 focus:ring-violet-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>

          <button onClick={generate} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />{t('password.generate')}
          </button>

          {password && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('password.output')}</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono break-all select-all">
                {password}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
