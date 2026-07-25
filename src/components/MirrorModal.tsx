import { useState, useEffect, useCallback, useRef } from 'react';
import { X, FlipHorizontal, FlipVertical, FlipHorizontal2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { fileToImage } from '../utils/imageProcessor';
import JSZip from 'jszip';

interface MirrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function mirrorImage(img: HTMLImageElement, horizontal: boolean, vertical: boolean): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(img, horizontal ? -canvas.width : 0, vertical ? -canvas.height : 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

export default function MirrorModal({ isOpen, onClose }: MirrorModalProps) {
  const { tasks } = useTaskStore();

  const [horizontal, setHorizontal] = useState(false);
  const [vertical, setVertical] = useState(false);
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
        const blob = await mirrorImage(img, horizontal, vertical);
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
  }, [isOpen, tasks, horizontal, vertical]);

  const handleApply = useCallback(async () => {
    if (tasks.length === 0) return;
    setProcessing(true);
    try {
      const zip = new JSZip();
      for (const task of tasks) {
        const img = await fileToImage(task.file);
        const blob = await mirrorImage(img, horizontal, vertical);
        const name = task.fileName.replace(/\.[^.]+$/, '') + '.png';
        zip.file(name, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.download = 'mirrored_images.zip';
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
    onClose();
  }, [tasks, horizontal, vertical, onClose]);

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">镜像翻转</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">将对所有 {tasks.length} 张图片进行镜像翻转</p>

        <div className="mt-6 space-y-5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {([
              {
                key: 'h' as const,
                label: '水平翻转',
                icon: FlipHorizontal,
                active: horizontal && !vertical,
                onClick: () => { setHorizontal(true); setVertical(false); },
              },
              {
                key: 'v' as const,
                label: '垂直翻转',
                icon: FlipVertical,
                active: !horizontal && vertical,
                onClick: () => { setHorizontal(false); setVertical(true); },
              },
              {
                key: 'hv' as const,
                label: '水平+垂直',
                icon: FlipHorizontal2,
                active: horizontal && vertical,
                onClick: () => { setHorizontal(true); setVertical(true); },
              },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={opt.onClick}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  opt.active
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>

          {(!horizontal && !vertical) && (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
              请选择一种翻转方式
            </div>
          )}

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
            {processing ? '处理中...' : '镜像并下载'}
          </button>
        </div>
      </div>
    </div>
  );
}
