import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Download,
  Play,
  Loader2,
  ArrowRight,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import { useTaskStore } from '../store/taskStore';
import { convertFormat } from '../utils/imageProcessor';
import type { ImageFormat } from '../types/index';
import { SUPPORTED_OUTPUT_FORMATS } from '../types/index';
import { formatSize } from '../utils/formatUtils';
import { useSEO, InjectJSONLD } from '../utils/seo';

interface FormatInfo {
  label: string;
  transparency: boolean;
  compression: string;
  lossy: boolean;
}

const FORMAT_INFO: Record<string, FormatInfo> = {
  png: { label: 'PNG', transparency: true, compression: '无损压缩', lossy: false },
  jpeg: { label: 'JPEG', transparency: false, compression: '有损压缩', lossy: true },
  jpg: { label: 'JPEG', transparency: false, compression: '有损压缩', lossy: true },
  webp: { label: 'WebP', transparency: true, compression: '有损/无损', lossy: true },
  gif: { label: 'GIF', transparency: true, compression: '无损压缩', lossy: false },
  bmp: { label: 'BMP', transparency: false, compression: '无压缩', lossy: false },
  ico: { label: 'ICO', transparency: true, compression: '无损压缩', lossy: false },
  tiff: { label: 'TIFF', transparency: true, compression: '无损压缩', lossy: false },
  avif: { label: 'AVIF', transparency: true, compression: '有损/无损', lossy: true },
};

interface ConvertResult {
  fileName: string;
  originalSize: number;
  resultSize: number;
  blob: Blob;
  url: string;
  targetFormat: string;
}

export default function Convert() {
  const { tasks } = useTaskStore();

  useSEO({
    title: '格式转换 - ImageToolbox | 在线图片格式互转PNG/JPEG/WebP/AVIF',
    description: '免费在线图片格式转换工具，支持PNG/JPEG/WebP/AVIF/GIF/BMP/ICO/TIFF格式互转。批量处理，可调节输出质量，纯本地处理保护隐私。',
    keywords: '图片格式转换,PNG转JPEG,WebP转换,AVIF转换,在线图片格式转换,批量格式转换,PNG转WebP,JPEG转PNG',
  });

  const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState<ConvertResult[]>([]);

  const hasFiles = tasks.length > 0;

  const handleFilesAdded = useCallback(() => {
    setResults([]);
  }, []);

  const handleProcess = useCallback(async () => {
    if (processing || tasks.length === 0) return;

    setProcessing(true);
    setResults([]);

    const newResults: ConvertResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      setCurrentIndex(i);
      const task = tasks[i];
      try {
        const blob = await convertFormat(task.file, targetFormat, quality);
        const url = URL.createObjectURL(blob);
        newResults.push({
          fileName: task.fileName,
          originalSize: task.originalSize,
          resultSize: blob.size,
          blob,
          url,
          targetFormat,
        });
      } catch {
        // skip failed
      }
    }

    setResults(newResults);
    setCurrentIndex(-1);
    setProcessing(false);
  }, [processing, tasks, targetFormat, quality]);

  const handleDownload = useCallback((result: ConvertResult) => {
    const a = document.createElement('a');
    const baseName = result.fileName.replace(/\.[^.]+$/, '');
    a.href = result.url;
    a.download = `${baseName}.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [targetFormat]);

  const handleDownloadAll = useCallback(() => {
    results.forEach((result) => {
      const a = document.createElement('a');
      const baseName = result.fileName.replace(/\.[^.]+$/, '');
      a.href = result.url;
      a.download = `${baseName}.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }, [results, targetFormat]);

  const formatBadgeColor = (fmt: string) => {
    const colors: Record<string, string> = {
      png: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
      jpeg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      jpg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      webp: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      gif: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
      bmp: 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600',
      ico: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
      tiff: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      avif: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
    };
    return colors[fmt] || 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600';
  };

  const selectedFormatInfo = FORMAT_INFO[targetFormat];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': '格式转换 - ImageToolbox',
        'description': '免费在线图片格式转换工具，PNG/JPEG/WebP/AVIF等格式互转。',
        'url': 'https://imagetoolbox.pages.dev/convert',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Page Title */}
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-7 h-7 text-violet-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              格式转换
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              PNG、JPEG、WebP、AVIF 等主流图片格式互转
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

          {/* Format Selection */}
          {hasFiles && (
            <section className="card p-6 mb-8 animate-slide-up">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">
                选择输出格式
              </h2>

              {/* Format Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {SUPPORTED_OUTPUT_FORMATS.map((fmt) => {
                  const info = FORMAT_INFO[fmt];
                  const isSelected = targetFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {info.label}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {info.compression}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {info.transparency && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                            透明
                          </span>
                        )}
                        {info.lossy && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            有损
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Format Info */}
              {selectedFormatInfo && (
                <div
                  className={`p-4 rounded-xl border ${formatBadgeColor(targetFormat)} mb-6`}
                >
                  <p className="text-sm">
                    已选择 <strong>{selectedFormatInfo.label}</strong> —
                    {selectedFormatInfo.compression}
                    {selectedFormatInfo.transparency ? '，支持透明通道' : ''}
                  </p>
                </div>
              )}

              {/* Quality Slider */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    输出质量
                  </span>
                  <span className="text-sm font-bold text-brand-500 tabular-nums">
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
                />
              </div>

              {/* File Summary */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
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
                    转换中... {currentIndex + 1}/{tasks.length}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    开始转换
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
                  转换结果
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
                        <span>{formatSize(result.originalSize)}</span>
                        <span>→</span>
                        <span className="text-brand-500 font-medium">
                          {formatSize(result.resultSize)}
                        </span>
                        <span className="text-brand-500">
                          (.{result.targetFormat})
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
