import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Download,
  Play,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import { useTaskStore } from '../store/taskStore';
import { compressImage } from '../utils/imageProcessor';
import type { CompressSettings } from '../types/index';
import { DEFAULT_COMPRESS_SETTINGS } from '../types/index';
import { formatSize } from '../utils/formatUtils';
import { useSEO, InjectJSONLD } from '../utils/seo';

interface CompressResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  blob: Blob;
  url: string;
}

export default function Compress() {
  const { tasks } = useTaskStore();

  useSEO({
    title: '图片压缩 - 批图网 | 在线图片无损有损压缩工具',
    description: '免费在线图片压缩工具，支持有损压缩、无损压缩、目标大小三种模式。批量压缩PNG/JPEG/WebP图片，纯本地处理保护隐私。',
    keywords: '图片压缩,在线图片压缩,PNG压缩,JPEG压缩,批量图片压缩,无损压缩,有损压缩,目标大小压缩',
  });

  const [mode, setMode] = useState<CompressSettings['mode']>(
    DEFAULT_COMPRESS_SETTINGS.mode,
  );
  const [quality, setQuality] = useState(DEFAULT_COMPRESS_SETTINGS.quality);
  const [targetSizeKB, setTargetSizeKB] = useState(500);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState<CompressResult[]>([]);

  const hasFiles = tasks.length > 0;

  const handleFilesAdded = useCallback(() => {
    setResults([]);
  }, []);

  const getQualityColor = (q: number) => {
    if (q >= 80) return 'text-emerald-500';
    if (q >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getQualityBg = (q: number) => {
    if (q >= 80) return 'bg-emerald-500';
    if (q >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleProcess = useCallback(async () => {
    if (processing || tasks.length === 0) return;

    setProcessing(true);
    setResults([]);

    const settings: CompressSettings = {
      mode,
      quality,
      ...(mode === 'targetSize' ? { targetSizeKB } : {}),
    };

    const newResults: CompressResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      setCurrentIndex(i);
      const task = tasks[i];
      try {
        const blob = await compressImage(task.file, settings);
        const url = URL.createObjectURL(blob);
        newResults.push({
          fileName: task.fileName,
          originalSize: task.originalSize,
          compressedSize: blob.size,
          blob,
          url,
        });
      } catch {
        // skip failed items
      }
    }

    setResults(newResults);
    setCurrentIndex(-1);
    setProcessing(false);
  }, [processing, tasks, mode, quality, targetSizeKB]);

  const handleDownload = useCallback((result: CompressResult) => {
    const a = document.createElement('a');
    const baseName = result.fileName.replace(/\.[^.]+$/, '');
    a.href = result.url;
    a.download = `${baseName}_compressed.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleDownloadAll = useCallback(() => {
    results.forEach((result) => {
      const a = document.createElement('a');
      const baseName = result.fileName.replace(/\.[^.]+$/, '');
      a.href = result.url;
      a.download = `${baseName}_compressed.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }, [results]);

  const averageReduction =
    results.length > 0
      ? Math.round(
          ((results.reduce((s, r) => s + r.originalSize - r.compressedSize, 0) /
            results.reduce((s, r) => s + r.originalSize, 0)) *
            100) || 0,
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': '图片压缩 - 批图网',
        'description': '免费在线图片压缩工具，支持有损/无损/目标大小压缩，批量处理。',
        'url': 'https://ppic.cc/compress',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Page Title */}
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              图片压缩
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              智能压缩，支持质量压缩、无损压缩和指定大小三种模式
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

          {/* Compression Settings */}
          {hasFiles && (
            <section className="card p-6 mb-8 animate-slide-up">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">
                压缩设置
              </h2>

              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { value: 'quality' as const, label: '质量压缩' },
                  { value: 'lossless' as const, label: '无损压缩' },
                  { value: 'targetSize' as const, label: '指定大小' },
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

              {/* Quality Slider */}
              {mode === 'quality' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      压缩质量
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${getQualityColor(quality)}`}
                    >
                      {quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${getQualityBg(quality).replace('bg-', '').replace('emerald-', '#10b981').replace('amber-', '#f59e0b').replace('red-', '#ef4444') || '#6366f1'} ${quality}%, #e2e8f0 ${quality}%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>低质量 / 小文件</span>
                    <span>高质量 / 大文件</span>
                  </div>
                </div>
              )}

              {/* Lossless Info */}
              {mode === 'lossless' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm">
                  无损压缩将使用 PNG 格式，保留所有原始像素数据，不损失任何质量。
                </div>
              )}

              {/* Target Size */}
              {mode === 'targetSize' && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    目标大小
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={targetSizeKB}
                    onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                    className="input-field w-32"
                  />
                  <span className="text-sm text-slate-400">KB</span>
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
                    压缩中... {currentIndex + 1}/{tasks.length}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    开始压缩
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
                  压缩结果
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    平均节省 {averageReduction}%
                  </div>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    全部下载
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {results.map((result, i) => {
                  const reduction = Math.round(
                    ((result.originalSize - result.compressedSize) /
                      result.originalSize) *
                      100,
                  );
                  return (
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
                          <span>{formatSize(result.originalSize)}</span>
                          <span>→</span>
                          <span className="text-emerald-500 font-medium">
                            {formatSize(result.compressedSize)}
                          </span>
                          <span className="text-emerald-500">
                            (-{reduction}%)
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
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
