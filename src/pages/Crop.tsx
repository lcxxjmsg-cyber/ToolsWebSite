import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Crop as CropIcon,
  Download,
  ArrowRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import { useTaskStore } from '../store/taskStore';
import { cropImage, fileToImage } from '../utils/imageProcessor';
import type { CropSettings } from '../types/index';
import { useSEO, InjectJSONLD } from '../utils/seo';

const PRESET_RATIOS: { label: string; value: number | null }[] = [
  { label: '自由', value: null },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '5:4', value: 5 / 4 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function Crop() {
  const { tasks } = useTaskStore();

  useSEO({
    title: '图片裁剪 - ImageToolbox | 在线图片自由裁剪工具',
    description: '免费在线图片裁剪工具，支持自由裁剪、预设比例(1:1/4:3/16:9等)、精确像素裁剪。拖拽选取裁剪区域，纯本地处理。',
    keywords: '图片裁剪,在线图片裁剪,自由裁剪,比例裁剪,1比1裁剪,16比9裁剪,像素裁剪',
  });

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [imgNaturalW, setImgNaturalW] = useState(0);
  const [imgNaturalH, setImgNaturalH] = useState(0);
  const [resultUrl, setResultUrl] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState<'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const hasImage = !!imageSrc;

  const handleFilesAdded = useCallback(async () => {
    const currentTasks = useTaskStore.getState().tasks;
    if (currentTasks.length === 0) return;

    const task = currentTasks[currentTasks.length - 1];
    try {
      const dataUrl = await fileToImage(task.file).then((img) => {
        setImgNaturalW(img.naturalWidth);
        setImgNaturalH(img.naturalHeight);

        const maxW = containerRef.current?.clientWidth ?? 600;
        const scale = Math.min(1, maxW / img.naturalWidth);
        setCropW(Math.round(img.naturalWidth * scale * 0.6));
        setCropH(Math.round(img.naturalHeight * scale * 0.6));
        setCropX(Math.round(img.naturalWidth * scale * 0.2));
        setCropY(Math.round(img.naturalHeight * scale * 0.2));

        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        return c.toDataURL('image/png');
      });
      setImageSrc(dataUrl);
      setResultUrl('');
      setResultBlob(null);
    } catch {
      // failed to load image
    }
  }, []);

  const getRelativePos = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const scaleX = imgNaturalW / rect.width;
      const scaleY = imgNaturalH / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [imgNaturalW, imgNaturalH],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, action: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se') => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(action);
      const pos = getRelativePos(e);
      setDragStart(pos);
      setCropStart({ x: cropX, y: cropY, w: cropW, h: cropH });
    },
    [getRelativePos, cropX, cropY, cropW, cropH],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getRelativePos(e as unknown as React.MouseEvent);
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      let nx = cropStart.x;
      let ny = cropStart.y;
      let nw = cropStart.w;
      let nh = cropStart.h;

      const lockAspect = (w: number, h: number, _baseW: number, _baseH: number): [number, number] => {
        if (!aspectRatio) return [w, h];
        const expectedH = w / aspectRatio;
        if (expectedH <= imgNaturalH - ny) return [w, expectedH];
        const expectedW = h * aspectRatio;
        if (expectedW <= imgNaturalW - nx) return [expectedW, h];
        return [w, h];
      };

      if (dragging === 'move') {
        nx = clamp(cropStart.x + dx, 0, imgNaturalW - nw);
        ny = clamp(cropStart.y + dy, 0, imgNaturalH - nh);
      } else if (dragging === 'resize-se') {
        const rawW = clamp(cropStart.w + dx, 10, imgNaturalW - cropStart.x);
        const rawH = clamp(cropStart.h + dy, 10, imgNaturalH - cropStart.y);
        [nw, nh] = lockAspect(rawW, rawH, nw, nh);
      } else if (dragging === 'resize-sw') {
        const rawW = Math.max(10, cropStart.w - dx);
        const rawX = clamp(cropStart.x + dx, 0, cropStart.x + cropStart.w - 10);
        const rawH = clamp(cropStart.h + dy, 10, imgNaturalH - cropStart.y);
        nw = rawW;
        nx = rawX;
        nh = aspectRatio ? nw / aspectRatio : rawH;
        nh = clamp(nh, 10, imgNaturalH - ny);
      } else if (dragging === 'resize-ne') {
        const rawW = clamp(cropStart.w + dx, 10, imgNaturalW - cropStart.x);
        const rawH = Math.max(10, cropStart.h - dy);
        const rawY = clamp(cropStart.y + dy, 0, cropStart.y + cropStart.h - 10);
        nw = rawW;
        nh = aspectRatio ? nw / aspectRatio : rawH;
        nh = clamp(nh, 10, imgNaturalH - rawY);
        ny = rawY;
      } else if (dragging === 'resize-nw') {
        const rawW = Math.max(10, cropStart.w - dx);
        const rawX = clamp(cropStart.x + dx, 0, cropStart.x + cropStart.w - 10);
        const rawH = Math.max(10, cropStart.h - dy);
        const rawY = clamp(cropStart.y + dy, 0, cropStart.y + cropStart.h - 10);
        nw = rawW;
        nx = rawX;
        nh = aspectRatio ? nw / aspectRatio : rawH;
        nh = clamp(nh, 10, imgNaturalH - rawY);
        ny = rawY;
      }

      setCropX(nx);
      setCropY(ny);
      setCropW(nw);
      setCropH(nh);
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, getRelativePos, dragStart, cropStart, aspectRatio, imgNaturalW, imgNaturalH]);

  const handleAspectSelect = useCallback(
    (ratio: number | null) => {
      setAspectRatio(ratio);
      if (ratio) {
        const newH = cropW / ratio;
        if (newH < imgNaturalH - cropY) {
          setCropH(newH);
        } else {
          const newW = cropH * ratio;
          if (newW < imgNaturalW - cropX) {
            setCropW(newW);
          } else {
            const maxW = imgNaturalW - cropX;
            setCropW(maxW);
            setCropH(maxW / ratio);
          }
        }
      }
    },
    [cropW, cropH, cropX, cropY, imgNaturalW, imgNaturalH],
  );

  const handleProcess = useCallback(async () => {
    if (!hasImage || processing) return;
    setProcessing(true);

    try {
      const task = tasks[tasks.length - 1];
      const settings: CropSettings = {
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
        aspectRatio: aspectRatio ?? undefined,
      };
      const blob = await cropImage(task.file, settings);
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
    } catch {
      // crop failed
    }

    setProcessing(false);
  }, [hasImage, processing, tasks, cropX, cropY, cropW, cropH, aspectRatio]);

  const handleDownload = useCallback(() => {
    if (!resultBlob) return;
    const task = tasks[tasks.length - 1];
    const baseName = task.fileName.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${baseName}_cropped.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultBlob, resultUrl, tasks]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': '图片裁剪 - ImageToolbox',
        'description': '免费在线图片裁剪工具，支持自由裁剪和预设比例。',
        'url': 'https://imagetoolbox.pages.dev/crop',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Page Title */}
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CropIcon className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              图片裁剪
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              自由裁剪、预设比例裁剪，精确控制裁剪区域
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

          {/* Crop Interface */}
          {hasImage && (
            <section className="space-y-6 animate-slide-up">
              {/* Preset Ratios */}
              <div className="card p-4">
                <div className="flex flex-wrap gap-2">
                  {PRESET_RATIOS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleAspectSelect(preset.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        aspectRatio === preset.value
                          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop Canvas */}
              <div className="card overflow-hidden">
                <div
                  ref={containerRef}
                  className="relative bg-[#0f0f0f] dark:bg-black flex items-center justify-center overflow-hidden"
                  style={{ minHeight: 400 }}
                >
                  <div className="relative inline-block">
                    <img
                      src={imageSrc}
                      alt="裁剪预览"
                      className="max-w-full max-h-[600px] block select-none"
                      draggable={false}
                      style={{ opacity: 0.6 }}
                    />

                    {/* Crop Overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
                        clipPath: `rect(0px, ${imgNaturalW}px, ${imgNaturalH}px, 0px)`,
                      }}
                    >
                      <div
                        className="absolute border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                        style={{
                          left: cropX,
                          top: cropY,
                          width: cropW,
                          height: cropH,
                          boxShadow: `0 0 0 9999px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.8)`,
                        }}
                      >
                        <img
                          src={imageSrc}
                          alt=""
                          className="absolute block max-w-none select-none"
                          draggable={false}
                          style={{
                            left: -cropX,
                            top: -cropY,
                            opacity: 1,
                          }}
                        />

                        {/* Move handle (center) */}
                        <div
                          className="absolute inset-4 cursor-move"
                          onMouseDown={(e) => handleMouseDown(e, 'move')}
                        />

                        {/* Resize handles */}
                        <div
                          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full cursor-nw-resize z-10"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-nw')}
                        />
                        <div
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full cursor-ne-resize z-10"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-ne')}
                        />
                        <div
                          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full cursor-sw-resize z-10"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-sw')}
                        />
                        <div
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full cursor-se-resize z-10"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-se')}
                        />

                        {/* Grid lines */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                        </div>

                        {/* Size badge */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono whitespace-nowrap">
                          {Math.round(cropW)} x {Math.round(cropH)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="btn-primary"
                >
                  裁剪
                </button>

                {resultUrl && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 btn-secondary"
                  >
                    <Download className="w-4 h-4" />
                    下载结果
                  </button>
                )}
              </div>

              {/* Result Preview */}
              {resultUrl && (
                <div className="card p-4 animate-slide-up">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    预览结果
                  </h3>
                  <img
                    src={resultUrl}
                    alt="裁剪结果"
                    className="max-w-full max-h-80 rounded-xl shadow-sm"
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
