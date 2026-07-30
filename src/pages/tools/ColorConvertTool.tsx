import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Palette } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) };
}

function toRgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function toHsl(r: number, g: number, b: number): string {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function ColorConvertTool() {
  const t = useT();
  const navigate = useNavigate();
  const [hex, setHex] = useState('#7c3aed');
  const [rgb, setRgb] = useState('');
  const [hsl, setHsl] = useState('');
  const [copiedRgb, setCopiedRgb] = useState(false);
  const [copiedHsl, setCopiedHsl] = useState(false);

  function handleHexChange(val: string) {
    setHex(val);
    const parsed = parseHex(val);
    if (parsed) {
      setRgb(toRgb(parsed.r, parsed.g, parsed.b));
      setHsl(toHsl(parsed.r, parsed.g, parsed.b));
    } else {
      setRgb('');
      setHsl('');
    }
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
              <Palette className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('colorconvert.title')}</h1>
              <p className="text-sm text-slate-500">{t('colorconvert.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input type="color" value={hex.startsWith('#') ? hex : '#' + hex} onChange={(e) => handleHexChange(e.target.value)}
              className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer" />
            <input value={hex} onChange={(e) => handleHexChange(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="#000000" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RGB</span>
                {rgb && <button onClick={() => handleCopy(rgb, setCopiedRgb)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copiedRgb ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copiedRgb ? t('common.copied') : t('common.copy')}
                </button>}
              </div>
              <p className="text-sm font-mono text-slate-900 dark:text-white select-all">{rgb || '-'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">HSL</span>
                {hsl && <button onClick={() => handleCopy(hsl, setCopiedHsl)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copiedHsl ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}{copiedHsl ? t('common.copied') : t('common.copy')}
                </button>}
              </div>
              <p className="text-sm font-mono text-slate-900 dark:text-white select-all">{hsl || '-'}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
