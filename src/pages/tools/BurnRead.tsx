import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flame, AlertTriangle, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { decryptMessage } from '../../utils/crypto';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function BurnRead() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useT();

  const [status, setStatus] = useState<'loading' | 'password' | 'revealed' | 'notfound' | 'error'>('loading');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!id) {
      setStatus('error');
      setErrorMsg(t('burn.read.invalid'));
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const keyFromHash = window.location.hash.slice(1);
    if (keyFromHash) {
      loadMessage(keyFromHash);
    } else {
      setStatus('password');
    }
  }, []);

  async function loadMessage(key?: string) {
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/burn/${id}`);
      if (res.status === 404) {
        setStatus('notfound');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(t('burn.read.error'));
        return;
      }

      const data = await res.json();

      let decrypted: string;
      try {
        decrypted = await decryptMessage(
          { ciphertext: data.ciphertext, iv: data.iv, salt: data.salt || undefined },
          password || undefined,
          key || undefined,
        );
      } catch {
        setStatus('password');
        setErrorMsg(t('burn.read.wrongPassword'));
        return;
      }

      setContent(decrypted);
      setStatus('revealed');

      fetch(`/api/burn/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      setStatus('error');
      setErrorMsg(t('burn.read.error'));
    }
  }

  function handleReveal() {
    loadMessage();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('nav.tools')}
        </button>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-slate-500">{t('burn.read.loading')}</p>
          </div>
        )}

        {status === 'notfound' && (
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('burn.read.notfound')}</h2>
            <p className="text-sm text-slate-500 mb-6">{t('burn.read.notfound.desc')}</p>
            <button
              onClick={() => navigate('/tools/burn')}
              className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
            >
              {t('burn.read.createNew')}
            </button>
          </div>
        )}

        {status === 'password' && (
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('burn.read.protected')}</h2>
              <p className="text-sm text-slate-500">{t('burn.read.protected.desc')}</p>
            </div>
            <div className="relative max-w-xs mx-auto">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
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

            {errorMsg && (
              <p className="text-sm text-red-500">{errorMsg}</p>
            )}

            <button
              onClick={handleReveal}
              disabled={!password}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
            >
              <Eye className="w-4 h-4" />
              {t('burn.read.reveal')}
            </button>
          </div>
        )}

        {status === 'revealed' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#141414] rounded-xl border border-amber-200 dark:border-amber-800/30 p-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{t('burn.read.title')}</h2>
                  <p className="text-xs text-slate-400">{t('burn.read.burned')}</p>
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                {content}
              </pre>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {t('burn.read.destroyed')}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('burn.read.errorTitle')}</h2>
            <p className="text-sm text-slate-500 mb-6">{errorMsg || t('burn.read.error')}</p>
            <button
              onClick={() => navigate('/tools/burn')}
              className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
            >
              {t('burn.read.createNew')}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
