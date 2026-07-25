import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Copy, Download, ScanLine, Loader2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import Tesseract from 'tesseract.js';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'chi_sim+eng', label: '简体中文 + 英文' },
  { value: 'eng', label: '英文' },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function OcrModal({ isOpen, onClose }: OcrModalProps) {
  const { selectedTaskId, tasks } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [language, setLanguage] = useState('chi_sim+eng');
  const [recognizing, setRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [fullImageUrl, setFullImageUrl] = useState('');
  const workerRef = useRef<Tesseract.Worker | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setResult('');
      setError('');
      setProgress(0);
      setStatusText('');
      setFullImageUrl('');
    } else if (selectedTask?.file) {
      fileToDataUrl(selectedTask.file).then(setFullImageUrl).catch(() => {});
    }
  }, [isOpen, selectedTask?.file]);

  const handleRecognize = useCallback(async () => {
    if (!fullImageUrl || recognizing) return;
    setRecognizing(true);
    setError('');
    setResult('');
    setProgress(0);
    setStatusText('正在初始化 OCR 引擎...');

    try {
      const origWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        const msg = String(args[0]);
        if (msg.includes('Parameter not found') || msg.includes('tesseract')) return;
        origWarn.apply(console, args);
      };

      const worker = await Tesseract.createWorker(language);
      workerRef.current = worker;

      const { data } = await worker.recognize(fullImageUrl);
      console.warn = origWarn;
      setResult(data.text);
      setProgress(100);
      setStatusText('识别完成');

      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR 识别失败');
      setStatusText('');
    } finally {
      setRecognizing(false);
    }
  }, [fullImageUrl, language, recognizing]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocr_result.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-xl glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">文字识别 (OCR)</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">识别图片中的文字内容</p>

        <div className="mt-6 space-y-4">
          {fullImageUrl && (
            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
              <img
                src={fullImageUrl}
                alt="预览"
                className="max-h-40 rounded-xl border border-slate-200 dark:border-slate-700 object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">识别语言</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={recognizing}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {!result && !recognizing && (
            <button
              onClick={handleRecognize}
              disabled={!fullImageUrl}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
              <ScanLine className="w-4 h-4" />
              开始识别
            </button>
          )}

          {recognizing && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                <span className="text-sm text-slate-600 dark:text-slate-300">{statusText || '识别中...'}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {result && (
            <>
              <textarea
                readOnly
                value={result}
                className="w-full h-48 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm resize-none focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  <Copy className="w-4 h-4" />
                  复制文本
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载 TXT
                </button>
                <button
                  onClick={handleRecognize}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  <ScanLine className="w-4 h-4" />
                  重新识别
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
