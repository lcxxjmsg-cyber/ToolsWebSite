import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Eye } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ColorPickerTool() {
  const t = useT();
  const navigate = useNavigate();
  const [color, setColor] = useState('#7c3aed');
  const [copied, setCopied] = useState(false);

  const rgb = (() => {
    const m = color.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  })();

  function handleCopy() {
    navigator.clipboard.writeText(color).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  const hexInput = color.startsWith('#') ? color : '#' + color;

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
              <Eye className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('colorpicker.title')}</h1>
              <p className="text-sm text-slate-500">{t('colorpicker.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input type="color" value={hexInput} onChange={(e) => setColor(e.target.value)}
              className="w-20 h-20 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input value={color} onChange={(e) => setColor(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="#000000" />
                <button onClick={handleCopy} className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {rgb && <p className="text-sm font-mono text-slate-500 dark:text-slate-400 select-all">{rgb}</p>}
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff',
              '#c0c0c0','#808080','#800000','#008000','#000080','#808000','#800080','#008080',
              '#ff4500','#ff8c00','#ffd700','#adff2f','#00ff7f','#00ced1','#1e90ff','#9370db',
              '#ff69b4','#f0e68c','#98fb98','#7fffd4','#87ceeb','#da70d6','#deb887','#b0e0e6',
              '#2f4f4f','#696969','#556b2f','#8b4513','#191970','#006400','#8b008b','#4b0082',
            ].map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className="w-full aspect-square rounded-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
