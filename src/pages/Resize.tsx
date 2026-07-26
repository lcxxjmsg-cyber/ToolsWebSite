import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Maximize2,
  Download,
  Play,
  Loader2,
  ArrowRight,
  Link as LinkIcon,
  Link2Off,
  Image as ImageIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import { useTaskStore } from '../store/taskStore';
import { resizeImage } from '../utils/imageProcessor';
import type { ResizeSettings } from '../types/index';
import { fileToImage } from '../utils/imageProcessor';
import { formatSize } from '../utils/formatUtils';
import { useSEO, InjectJSONLD } from '../utils/seo';

interface ResizeResult {
  fileName: string;
  originalSize: number;
  resultSize: number;
  originalW: number;
  originalH: number;
  resultW: number;
  resultH: number;
  blob: Blob;
  url: string;
}

export default function Resize() {
  const { tasks } = useTaskStore();

  useSEO({
    title: '调整尺寸 - 批图网 | 在线图片缩放调整大小工具',
    description: '免费在线图片尺寸调整工具，支持百分比缩放、像素尺寸、适应尺寸三种模式。锁定宽高比，批量调整图片大小，纯本地处理。',
    keywords: '调整图片尺寸,图片缩放,在线图片缩放,图片大小调整,像素调整,批量调整尺寸,长宽比锁定',
  });

  const [mode, setMode] = useState<ResizeSettings['mode']>('percent');
  const [percent, setPercent] = useState(100);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [fitWidth, setFitWidth] = useState(0);
  const [fitHeight, setFitHeight] = useState(0);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain');
  const [originalW, setOriginalW] = useState(0);
  const [originalH, setOriginalH] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState<ResizeResult[]>([]);

  const hasFiles = tasks.length > 0;
  const aspectRatio = originalH > 0 ? originalW / originalH : 1;

  const handleFilesAdded = useCallback(async () => {
    setResults([]);
    const currentTasks = useTaskStore.getState().tasks;
    if (currentTasks.length === 0) return;
    const task = currentTasks[currentTasks.length - 1];
    try {
      const img = await fileToImage(task.file);
      setOriginalW(img.naturalWidth);
      setOriginalH(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setFitWidth(img.naturalWidth);
      setFitHeight(img.naturalHeight);
    } catch {
      // could not load
    }
  }, []);

  const handleWidthChange = useCallback(
    (v: string) => {
      const w = v ? Number(v) : 0;
      setWidth(w);
      if (lockAspectRatio && w > 0) {
        setHeight(Math.round(w / aspectRatio));
      }
    },
    [lockAspectRatio, aspectRatio],
  );

  const handleHeightChange = useCallback(
    (v: string) => {
      const h = v ? Number(v) : 0;
      setHeight(h);
      if (lockAspectRatio && h > 0) {
        setWidth(Math.round(h * aspectRatio));
      }
    },
    [lockAspectRatio, aspectRatio],
  );

  const handleProcess = useCallback(async () => {
    if (processing || tasks.length === 0) return;

    setProcessing(true);
    setResults([]);

    const settings: ResizeSettings = {
      mode,
      lockAspectRatio,
      ...(mode === 'percent'
        ? { percent }
        : mode === 'pixels'
          ? { width, height }
          : { fitWidth, fitHeight, fitMode }),
    };

    const newResults: ResizeResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      setCurrentIndex(i);
      const task = tasks[i];
      try {
        const tempImg = await fileToImage(task.file);
        const blob = await resizeImage(task.file, settings);
        const url = URL.createObjectURL(blob);
        const resultImg = new Image();
        await new Promise<void>((resolve) => {
          resultImg.onload = () => resolve();
          resultImg.src = url;
        });
        newResults.push({
          fileName: task.fileName,
          originalSize: task.originalSize,
          resultSize: blob.size,
          originalW: tempImg.naturalWidth,
          originalH: tempImg.naturalHeight,
          resultW: resultImg.naturalWidth,
          resultH: resultImg.naturalHeight,
          blob,
          url,
        });
      } catch {
        // skip
      }
    }

    setResults(newResults);
    setCurrentIndex(-1);
    setProcessing(false);
  }, [processing, tasks, mode, percent, width, height, fitWidth, fitHeight, fitMode, lockAspectRatio]);

  const handleDownload = useCallback((result: ResizeResult) => {
    const a = document.createElement('a');
    const baseName = result.fileName.replace(/\.[^.]+$/, '');
    a.href = result.url;
    a.download = `${baseName}_resized.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleDownloadAll = useCallback(() => {
    results.forEach((result) => {
      const a = document.createElement('a');
      const baseName = result.fileName.replace(/\.[^.]+$/, '');
      a.href = result.url;
      a.download = `${baseName}_resized.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }, [results]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': '调整尺寸 - 批图网',
        'description': '免费在线图片尺寸调整工具，百分比、像素、适应三种模式。',
        'url': 'https://ppic.cc/resize',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Page Title */}
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
              <Maximize2 className="w-7 h-7 text-sky-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              调整尺寸
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              按百分比、指定像素或适合尺寸来缩放图片
            </p>
            <Link
              to="/workspace"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-500 hover:text-brand-600 transition-colors"
            >
              前往工作台使用更多功能
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>

          {/* Upload Zone */}
          <section className="mb-8">
            <UploadZone onFilesAdded={handleFilesAdded} />
          </section>

          {/* Resize Settings */}
          {hasFiles && (
            <section className="card p-6 mb-8 animate-slide-up">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">
                尺寸设置
              </h2>

              {/* Original Info */}
              {originalW > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 dark:text-slate-400 mb-6">
                  原始尺寸: {originalW} x {originalH} px
                </div>
              )}

              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { value: 'percent' as const, label: '百分比' },
                  { value: 'pixels' as const, label: '指定像素' },
                  { value: 'fit' as const, label: '适合尺寸' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      mode === opt.value
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Percent Mode */}
              {mode === 'percent' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      缩放比例
                    </span>
                    <span className="text-sm font-bold text-brand-500 tabular-nums">
                      {percent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={500}
                    step={1}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  {originalW > 0 && (
                    <p className="text-xs text-slate-400">
                      输出尺寸: {Math.round((originalW * percent) / 100)} x {Math.round((originalH * percent) / 100)} px
                    </p>
                  )}
                </div>
              )}

              {/* Pixels Mode */}
              {mode === 'pixels' && (
                <div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        宽度 (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={width ?? ''}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder="宽度"
                        className="input-field"
                      />
                    </div>

                    <button
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`p-3 rounded-xl mt-5 transition-colors ${
                        lockAspectRatio
                          ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                      title={lockAspectRatio ? '锁定比例' : '解除锁定'}
                    >
                      {lockAspectRatio ? (
                        <LinkIcon className="w-4 h-4" />
                      ) : (
                        <Link2Off className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        高度 (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={height ?? ''}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        placeholder="高度"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fit Mode */}
              {mode === 'fit' && (
                <div>
                  <div className="flex items-center gap-4 flex-wrap mb-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        最大宽度 (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={fitWidth || ''}
                        onChange={(e) => setFitWidth(Number(e.target.value))}
                        placeholder="最大宽度"
                        className="input-field"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        最大高度 (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={fitHeight || ''}
                        onChange={(e) => setFitHeight(Number(e.target.value))}
                        placeholder="最大高度"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { value: 'contain' as const, label: '包含 (全部显示)' },
                      { value: 'cover' as const, label: '覆盖 (填满裁剪)' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFitMode(opt.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          fitMode === opt.value
                            ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* File Summary */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>{tasks.length} 个文件</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>
                    总大小 {formatSize(tasks.reduce((s, t) => s + t.originalSize, 0))}
                  </span>
                </div>
              </div>

              {/* Process Button */}
              <button
                onClick={handleProcess}
                disabled={processing}
                className="mt-5 flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-lg shadow-brand-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    处理中... {currentIndex + 1}/{tasks.length}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    开始处理
                  </>
                )}
              </button>
            </section>
          )}

          {/* Results */}
          {results.length > 0 && (
            <section className="card p-6 animate-slide-up">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  处理结果
                </h2>
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  全部下载
                </button>
              </div>

              <div className="space-y-3">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {result.fileName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>
                          {result.originalW} x {result.originalH}
                        </span>
                        <span>→</span>
                        <span className="text-brand-500 font-medium">
                          {result.resultW} x {result.resultH}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(result)}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
