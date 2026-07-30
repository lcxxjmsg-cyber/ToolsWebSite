import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Table } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length) return '';
  const keys = Array.from(new Set(arr.flatMap(Object.keys)));
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  return [keys.join(','), ...arr.map((row) => keys.map((k) => esc(row[k] ?? '')).join(','))].join('\n');
}

function csvToJson(csv: string): string {
  const lines = csv.trim().split('\n');
  if (!lines.length) return '[]';
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
    result.push(obj);
  }
  return JSON.stringify(result, null, 2);
}

export default function JsonCsvTool() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'json2csv' | 'csv2json'>('json2csv');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function handleConvert() {
    setError('');
    setOutput('');
    if (!input.trim()) return;
    try {
      setOutput(mode === 'json2csv' ? jsonToCsv(input) : csvToJson(input));
    } catch { setError(t('jsoncsv.error')); }
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
              <Table className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('jsoncsv.title')}</h1>
              <p className="text-sm text-slate-500">{t('jsoncsv.subtitle')}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setMode('json2csv'); setOutput(''); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'json2csv' ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t('jsoncsv.json2csv')}</button>
            <button onClick={() => { setMode('csv2json'); setOutput(''); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'csv2json' ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t('jsoncsv.csv2json')}</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('jsoncsv.input')}</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={8}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
              placeholder={mode === 'json2csv' ? t('jsoncsv.input.placeholderJson') : t('jsoncsv.input.placeholderCsv')} />
          </div>

          <button onClick={handleConvert} disabled={!input.trim()} className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {mode === 'json2csv' ? t('jsoncsv.toCsv') : t('jsoncsv.toJson')}
          </button>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('jsoncsv.output')}</label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <textarea readOnly value={output} rows={8}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono resize-none" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
