import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { X, RefreshCw, Download } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { fileToImage } from '../utils/imageProcessor';

interface MosaicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function pixelateBlock(ctx: CanvasRenderingContext2D, x: number, y: number, blockSize: number) {
  const imageData = ctx.getImageData(x, y, blockSize, blockSize);
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    r += imageData.data[i];
    g += imageData.data[i + 1];
    b += imageData.data[i + 2];
  }
  const count = imageData.data.length / 4;
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, blockSize, blockSize);
}

export default function MosaicModal({ isOpen, onClose }: MosaicModalProps) {
  const { selectedTaskId, tasks } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [blockSize, setBlockSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);

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
    if (!isOpen || !selectedTask) return;
    setImageLoaded(false);
    isDrawingRef.current = false;

    fileToImage(selectedTask.file).then((img) => {
      originalImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = containerRef.current ? containerRef.current.clientWidth - 32 : 600;
      const maxH = 500;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxW || h > maxH) {
        const scale = Math.min(maxW / w, maxH / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      setImageLoaded(true);
    });
  }, [isOpen, selectedTask]);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY),
    };
  }, []);

  const drawAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;
    const ctx = canvas.getContext('2d')!;
    const bx = coords.x - (coords.x % blockSize);
    const by = coords.y - (coords.y % blockSize);
    pixelateBlock(ctx, Math.max(0, bx), Math.max(0, by), blockSize);
  }, [blockSize, getCanvasCoords]);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    drawAt(e.clientX, e.clientY);
  }, [drawAt]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    drawAt(e.clientX, e.clientY);
  }, [drawAt]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const canvasEl = canvasRef.current;

  useEffect(() => {
    const canvas = canvasEl;
    if (!canvas) return;

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const touch = e.touches[0];
      drawAt(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const touch = e.touches[0];
      drawAt(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: globalThis.TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasEl, drawAt]);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `mosaic_${selectedTask?.fileName || 'image'}.png`;
    link.href = dataUrl;
    link.click();
  }, [selectedTask]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-2xl glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">马赛克工具</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">拖拽绘制马赛克区域</p>

        {!selectedTask ? (
          <div className="mt-6 text-center py-12 text-slate-400">
            请先选择一张图片
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                马赛克块大小: {blockSize}px
              </label>
              <input
                type="range"
                min={5}
                max={50}
                value={blockSize}
                onChange={(e) => setBlockSize(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>

            <div
              ref={containerRef}
              className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl p-4"
            >
              <canvas
                ref={canvasRef}
                className="max-w-full cursor-crosshair rounded touch-none"
                style={{ touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={!imageLoaded}
                className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                重置
              </button>
              <button
                onClick={handleDownload}
                disabled={!imageLoaded}
                className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
