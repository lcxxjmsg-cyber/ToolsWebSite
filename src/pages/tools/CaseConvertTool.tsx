import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Text } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function CaseConvertTool() {
  const t = useT();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeCase, setActiveCase] = useState('');
  const [copied, setCopied] = useState(false);

  function convert(type: string) {
    setActiveCase(type);
    setCopied(false);
    if (!input) { setOutput(''); return; }
    switch (type) {
      case 'upper': setOutput(input.toUpperCase()); break;
      case 'lower': setOutput(input.toLowerCase()); break;
      case 'title': setOutput(input.replace(/\b\w/g, (c) => c.toUpperCase())); break;
      case 'camel': setOutput(input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, (c) => c.toLowerCase())); break;
      case 'pascal': setOutput(input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, (c) => c.toUpperCase())); break;
      case 'snake': setOutput(input.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[-_\s]+/g, '_')); break;
      case 'kebab': setOutput(input.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/[_\s]+/g, '-')); break;
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  const cases = ['upper', 'lower', 'title', 'camel', 'pascal', 'snake', 'kebab'];

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
              <Text className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('caseconvert.title')}</h1>
              <p className="text-sm text-slate-500">{t('caseconvert.subtitle')}</p>
            </div>
          </div>

          <div>
            <textarea value={input} onChange={(e) => { setInput(e.target.value); setActiveCase(''); setOutput(''); }} rows={5}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
              placeholder={t('caseconvert.input.placeholder')} />
          </div>

          <div className="flex flex-wrap gap-2">
            {cases.map((c) => (
              <button key={c} onClick={() => convert(c)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeCase === c ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {t(`caseconvert.${c}`)}
              </button>
            ))}
          </div>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('caseconvert.output')}</label>
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
