import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Download,
  Play,
  Loader2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import { useTaskStore } from '../store/taskStore';
import { applyFilters, fileToImage } from '../utils/imageProcessor';
import type { FilterSettings } from '../types/index';
import { DEFAULT_FILTER_SETTINGS } from '../types/index';
import { useSEO, InjectJSONLD } from '../utils/seo';

interface FilterSlider {
  key: keyof FilterSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  defaultValue: number;
}

const FILTER_SLIDERS: FilterSlider[] = [
  { key: 'brightness', label: '亮度', min: 0, max: 200, step: 1, defaultValue: 100 },
  { key: 'contrast', label: '对比度', min: 0, max: 200, step: 1, defaultValue: 100 },
  { key: 'saturation', label: '饱和度', min: 0, max: 200, step: 1, defaultValue: 100 },
  { key: 'hueRotate', label: '色相', min: 0, max: 360, step: 1, unit: '°', defaultValue: 0 },
  { key: 'grayscale', label: '灰度', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'sepia', label: '怀旧', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'blur', label: '模糊', min: 0, max: 20, step: 0.5, defaultValue: 0 },
  { key: 'invert', label: '反相', min: 0, max: 100, step: 1, defaultValue: 0 },
  { key: 'opacity', label: '透明度', min: 0, max: 100, step: 1, defaultValue: 100 },
];

function buildFilterString(settings: FilterSettings): string {
  const parts: string[] = [];
  if (settings.blur > 0) parts.push(`blur(${settings.blur}px)`);
  if (settings.brightness !== 100) parts.push(`brightness(${settings.brightness}%)`);
  if (settings.contrast !== 100) parts.push(`contrast(${settings.contrast}%)`);
  if (settings.grayscale > 0) parts.push(`grayscale(${settings.grayscale}%)`);
  if (settings.hueRotate !== 0) parts.push(`hue-rotate(${settings.hueRotate}deg)`);
  if (settings.invert > 0) parts.push(`invert(${settings.invert}%)`);
  if (settings.opacity < 100) parts.push(`opacity(${settings.opacity}%)`);
  if (settings.saturation !== 100) parts.push(`saturate(${settings.saturation}%)`);
  if (settings.sepia > 0) parts.push(`sepia(${settings.sepia}%)`);
  return parts.join(' ');
}

export default function Filter() {
  useTaskStore();

  useSEO({
    title: '滤镜特效 - 批图网 | 在线图片滤镜调色工具',
    description: '免费在线图片滤镜工具，支持亮度、对比度、饱和度、色相、灰度、怀旧、模糊、反相、透明度9种调整。实时预览，纯本地处理。',
    keywords: '图片滤镜,在线图片滤镜,调色工具,亮度调整,对比度调整,饱和度,灰度滤镜,怀旧滤镜,模糊效果',
  });

  const [filters, setFilters] = useState<FilterSettings>({ ...DEFAULT_FILTER_SETTINGS });
  const [previewSrc, setPreviewSrc] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeFile, setActiveFile] = useState<File | null>(null);

  const hasImage = !!previewSrc;

  const handleFilesAdded = useCallback(async () => {
    const currentTasks = useTaskStore.getState().tasks;
    if (currentTasks.length === 0) return;
    const task = currentTasks[currentTasks.length - 1];
    setActiveFile(task.file);
    setResultUrl('');
    setResultBlob(null);
    try {
      const dataUrl = await fileToImage(task.file).then((img) => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        return c.toDataURL('image/png');
      });
      setPreviewSrc(dataUrl);
    } catch {
      // could not load
    }
  }, []);

  const handleSliderChange = useCallback(
    (key: keyof FilterSettings, value: number) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTER_SETTINGS });
  }, []);

  const handleProcess = useCallback(async () => {
    if (!activeFile || processing) return;
    setProcessing(true);
    try {
      const blob = await applyFilters(activeFile, filters);
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
    } catch {
      // processing failed
    }
    setProcessing(false);
  }, [activeFile, processing, filters]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !activeFile) return;
    const baseName = activeFile.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${baseName}_filtered.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultBlob, resultUrl, activeFile]);

  const filterString = buildFilterString(filters);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': '滤镜特效 - 批图网',
        'description': '免费在线图片滤镜工具，亮度、对比度、饱和度等9种调整。',
        'url': 'https://ppic.cc/filter',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Page Title */}
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-rose-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              滤镜特效
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              亮度、对比度、饱和度等专业级图片调整
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

          {/* Filter Interface */}
          {hasImage && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
              {/* Preview */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    实时预览
                  </h3>
                </div>
                <div className="bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)_50%/20px_20px] dark:bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)_50%/20px_20px]">
                  <img
                    src={previewSrc}
                    alt="滤镜预览"
                    className="w-full object-contain max-h-[500px]"
                    style={{ filter: filterString }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    调整参数
                  </h3>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重置全部
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {FILTER_SLIDERS.map((slider) => {
                    const value = filters[slider.key] as number;
                    const isTouched = value !== slider.defaultValue;
                    return (
                      <div key={slider.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-medium transition-colors ${
                              isTouched
                                ? 'text-brand-500'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {slider.label}
                          </span>
                          <span
                            className={`text-xs tabular-nums font-mono ${
                              isTouched
                                ? 'text-brand-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {value}
                            {slider.unit ?? ''}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          value={value}
                          onChange={(e) =>
                            handleSliderChange(slider.key, Number(e.target.value))
                          }
                          className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleProcess}
                    disabled={processing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        应用滤镜
                      </>
                    )}
                  </button>

                  {resultUrl && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      下载结果
                    </button>
                  )}
                </div>

                {/* Result Preview */}
                {resultUrl && (
                  <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                      处理结果
                    </h4>
                    <img
                      src={resultUrl}
                      alt="处理结果"
                      className="max-w-full max-h-48 rounded-xl shadow-sm"
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
