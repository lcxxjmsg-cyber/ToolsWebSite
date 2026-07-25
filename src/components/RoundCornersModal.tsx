import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Circle } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { fileToImage } from '../utils/imageProcessor';
import JSZip from 'jszip';

interface RoundCornersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function roundCorners(img: HTMLImageElement, radius: number, circular: boolean): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.beginPath();
  if (circular) {
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  } else {
    const r = radius;
    const w = canvas.width;
    const h = canvas.height;
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.arcTo(w, 0, w, r, r);
    ctx.lineTo(w, h - r);
    ctx.arcTo(w, h, w - r, h, r);
    ctx.lineTo(r, h);
    ctx.arcTo(0, h, 0, h - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
  }
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

export default function RoundCornersModal({ isOpen, onClose }: RoundCornersModalProps) {
  const { tasks } = useTaskStore();

  const [radius, setRadius] = useState(20);
  const [circular, setCircular] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatingRef = useRef(false);

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
    if (!isOpen || tasks.length === 0) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    const generate = async () => {
      if (generatingRef.current) return;
      generatingRef.current = true;
      try {
        const img = await fileToImage(tasks[0].file);
        if (cancelled) return;
        const blob = await roundCorners(img, radius, circular);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
        if (canvasRef.current) {
          const cvs = canvasRef.current;
          const displayImg = new Image();
          displayImg.onload = () => {
            cvs.width = displayImg.naturalWidth;
            cvs.height = displayImg.naturalHeight;
            const ctx = cvs.getContext('2d')!;
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            ctx.drawImage(displayImg, 0, 0);
          };
          displayImg.src = url;
        }
      } catch {
        // ignore
      } finally {
        generatingRef.current = false;
      }
    };
    const timer = setTimeout(generate, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, tasks, radius, circular]);

  const handleApply = useCallback(async () => {
    if (tasks.length === 0) return;
    setProcessing(true);
    try {
      const zip = new JSZip();
      for (const task of tasks) {
        const img = await fileToImage(task.file);
        const blob = await roundCorners(img, radius, circular);
        const name = task.fileName.replace(/\.[^.]+$/, '') + '.png';
        zip.file(name, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.download = 'rounded_images.zip';
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
    onClose();
  }, [tasks, radius, circular, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-md glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">圆角 / 裁剪</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">将对所有 {tasks.length} 张图片进行圆角处理</p>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">圆角半径</label>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400 tabular-nums">
              {circular ? '—' : `${radius}px`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={circular ? 0 : radius}
            onChange={(e) => {
              setRadius(parseInt(e.target.value));
              setCircular(false);
            }}
            disabled={circular}
            className="w-full accent-brand-500 disabled:opacity-30"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0px</span>
            <span>200px</span>
          </div>

          <button
            onClick={() => setCircular(!circular)}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              circular
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Circle className="w-4 h-4" />
            圆形裁剪
          </button>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
            />
          </div>

          {tasks.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tasks.map((task) => (
                <img
                  key={task.id}
                  src={task.thumbnail}
                  alt={task.fileName}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5">
            取消
          </button>
          <button
            onClick={handleApply}
            disabled={tasks.length === 0 || processing}
            className="btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? '处理中...' : '圆角并下载'}
          </button>
        </div>
      </div>
    </div>
  );
}
