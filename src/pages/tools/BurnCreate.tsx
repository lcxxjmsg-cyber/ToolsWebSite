import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Copy, Check, ArrowLeft, Eye, EyeOff, Clock, Lock, FileText } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { encryptMessage } from '../../utils/crypto';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const EXPIRATION_OPTIONS = [
  { value: 0, key: 'burn.expire.never' },
  { value: 1800, key: 'burn.expire.30min' },
  { value: 3600, key: 'burn.expire.1hour' },
  { value: 86400, key: 'burn.expire.24hour' },
  { value: 604800, key: 'burn.expire.7day' },
];

export default function BurnCreate() {
  const t = useT();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState(3600);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!message.trim()) return;
    if (message.length > 1024) {
      setError(t('burn.error.tooLong'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const encrypted = await encryptMessage(message, password || undefined);

      const res = await fetch('/api/burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt || null,
          expiresIn: expiresIn > 0 ? expiresIn : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      const { id } = await res.json();
      const hash = encrypted.key ? `#${encrypted.key}` : '';
      setResultUrl(`${window.location.origin}/tools/burn/${id}${hash}`);
    } catch (e) {
      setError(t('burn.error.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const charsLeft = 1024 - message.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('nav.tools')}
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('burn.title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('burn.subtitle')}</p>
          </div>
        </div>

        {!resultUrl ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1" />
                {t('burn.message')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1024}
                rows={6}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141414] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder={t('burn.placeholder')}
              />
              <p className={`text-xs mt-1 text-right ${charsLeft < 50 ? 'text-red-500' : 'text-slate-400'}`}>
                {charsLeft} / 1024
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Lock className="w-4 h-4 inline mr-1" />
                {t('burn.password')}
                <span className="text-xs text-slate-400 ml-1.5 font-normal">{t('burn.password.hint')}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141414] px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t('burn.password.placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                {t('burn.expire')}
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPIRATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiresIn(opt.value)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${expiresIn === opt.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {t(opt.key)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={!message.trim() || loading}
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  {t('burn.create')}
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              {t('burn.security')}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('burn.created')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('burn.created.desc')}</p>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={resultUrl}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono select-all"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <button
              onClick={() => { setResultUrl(''); setMessage(''); setPassword(''); }}
              className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
            >
              {t('burn.createAnother')}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
