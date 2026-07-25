import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Play, Grid3X3, Columns, Rows } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MergeLayout = 'horizontal' | 'vertical' | 'grid';

function mergeHorizontal(images: HTMLImageElement[]): HTMLCanvasElement {
  const totalW = images.reduce((sum, img) => sum + img.naturalWidth, 0);
  const maxH = Math.max(...images.map((img) => img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = maxH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let x = 0;
  for (const img of images) {
    const y = (maxH - img.naturalHeight) / 2;
    ctx.drawImage(img, x, y);
    x += img.naturalWidth;
  }
  return canvas;
}

function mergeVertical(images: HTMLImageElement[]): HTMLCanvasElement {
  const totalH = images.reduce((sum, img) => sum + img.naturalHeight, 0);
  const maxW = Math.max(...images.map((img) => img.naturalWidth));
  const canvas = document.createElement('canvas');
  canvas.width = maxW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let y = 0;
  for (const img of images) {
    const x = (maxW - img.naturalWidth) / 2;
    ctx.drawImage(img, x, y);
    y += img.naturalHeight;
  }
  return canvas;
}

function mergeGrid(images: HTMLImageElement[], cols: number): HTMLCanvasElement {
  const rows = Math.ceil(images.length / cols);
  const cellW = Math.max(...images.map((img) => img.naturalWidth));
  const cellH = Math.max(...images.map((img) => img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  images.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = col * cellW + (cellW - img.naturalWidth) / 2;
    const cy = row * cellH + (cellH - img.naturalHeight) / 2;
    ctx.drawImage(img, cx, cy);
  });
  return canvas;
}

export default function MergeModal({ isOpen, onClose }: MergeModalProps) {
  const { tasks } = useTaskStore();

  const [layout, setLayout] = useState<MergeLayout>('horizontal');
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
    if (!isOpen || tasks.length === 0) return;
    let cancelled = false;
    const loadTasks = async () => {
      const images: HTMLImageElement[] = [];
      for (const task of tasks) {
        if (cancelled) return;
        try {
          const img = await loadImage(URL.createObjectURL(task.file));
          images.push(img);
        } catch {
          // skip failed loads
        }
      }
      if (!cancelled) {
        setLoadedImages(images);
      }
    };
    loadTasks();
    return () => { cancelled = true; };
  }, [isOpen, tasks]);

  const generatePreview = useCallback(() => {
    if (loadedImages.length === 0) return;
    let canvas: HTMLCanvasElement;
    if (layout === 'horizontal') {
      canvas = mergeHorizontal(loadedImages);
    } else if (layout === 'vertical') {
      canvas = mergeVertical(loadedImages);
    } else {
      canvas = mergeGrid(loadedImages, gridCols);
    }
    const url = canvas.toDataURL('image/png');
    setPreviewUrl(url);
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = canvas.width;
      previewCanvasRef.current.height = canvas.height;
      const pctx = previewCanvasRef.current.getContext('2d')!;
      pctx.clearRect(0, 0, canvas.width, canvas.height);
      pctx.drawImage(canvas, 0, 0);
    }
  }, [layout, loadedImages, gridCols]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'merged-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [previewUrl]);

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">合并图片</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          将 {tasks.length} 张图片合并为一张
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">排列方式</label>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
              {([
                { key: 'horizontal' as const, label: '横向拼接', icon: Columns },
                { key: 'vertical' as const, label: '纵向拼接', icon: Rows },
                { key: 'grid' as const, label: '宫格排列', icon: Grid3X3 },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setLayout(opt.key)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    layout === opt.key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {layout === 'grid' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">列数</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={gridCols || ''}
                  onChange={(e) => setGridCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-full input-field text-sm py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">行数</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={gridRows || ''}
                  onChange={(e) => setGridRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-full input-field text-sm py-2 mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              图片列表 ({tasks.length}张)
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              {tasks.map((task) => (
                <div key={task.id} className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {task.thumbnail ? (
                    <img src={task.thumbnail} alt={task.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 truncate p-1">
                      {task.fileName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generatePreview}
              disabled={loadedImages.length === 0}
              className="flex-1 btn-secondary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              合并预览
            </button>
            <button
              onClick={handleDownload}
              disabled={!previewUrl}
              className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              下载合并图
            </button>
          </div>

          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-auto"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5">
            取消
          </button>
          <button
            onClick={handleDownload}
            disabled={!previewUrl}
            className="btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}
