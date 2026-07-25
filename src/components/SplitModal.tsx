import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Images } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import JSZip from 'jszip';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function splitImage(img: HTMLImageElement, rows: number, cols: number): HTMLCanvasElement[] {
  const tileW = img.naturalWidth / cols;
  const tileH = img.naturalHeight / rows;
  const tiles: HTMLCanvasElement[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = document.createElement('canvas');
      canvas.width = tileW;
      canvas.height = tileH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
      tiles.push(canvas);
    }
  }
  return tiles;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

async function createZip(tiles: HTMLCanvasElement[], rows: number, cols: number): Promise<Blob> {
  const zip = new JSZip();
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const blob = await canvasToBlob(tiles[idx]);
      zip.file(`tile_r${r + 1}_c${c + 1}.png`, blob);
      idx++;
    }
  }
  return await zip.generateAsync({ type: 'blob' });
}

export default function SplitModal({ isOpen, onClose }: SplitModalProps) {
  const { selectedTaskId, tasks } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen || !selectedTask) {
      setOriginalImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => setOriginalImg(img);
    img.onerror = () => setOriginalImg(null);
    img.src = URL.createObjectURL(selectedTask.file);
    return () => { if (img.src) URL.revokeObjectURL(img.src); };
  }, [isOpen, selectedTask]);

  const handleSplitAndDownload = useCallback(async () => {
    if (!originalImg) return;
    const tiles = splitImage(originalImg, rows, cols);
    const zipBlob = await createZip(tiles, rows, cols);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'split-tiles.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [originalImg, rows, cols]);

  const handleDownloadSingle = useCallback(async () => {
    if (!originalImg) return;
    const tiles = splitImage(originalImg, rows, cols);
    for (let i = 0; i < tiles.length; i++) {
      const blob = await canvasToBlob(tiles[i]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const r = Math.floor(i / cols) + 1;
      const c = (i % cols) + 1;
      a.href = url;
      a.download = `tile_r${r}_c${c}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [originalImg, rows, cols]);

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">切割图片</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          将图片切分为等分的网格块
        </p>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">行数</label>
              <input
                type="number"
                min={1}
                max={20}
                value={rows || ''}
                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full input-field text-sm py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">列数</label>
              <input
                type="number"
                min={1}
                max={20}
                value={cols || ''}
                onChange={(e) => setCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full input-field text-sm py-2 mt-1"
              />
            </div>
          </div>

          {originalImg && (
            <div className="text-sm text-brand-600 dark:text-brand-400 font-medium text-center">
              每块尺寸: {Math.round(originalImg.naturalWidth / cols)} × {Math.round(originalImg.naturalHeight / rows)} px
              &nbsp;&middot;&nbsp;共 {rows * cols} 块
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">预览</label>
            <div
              ref={previewRef}
              className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white"
            >
              {selectedTask?.thumbnail ? (
                <div className="relative">
                  <img src={selectedTask.thumbnail} alt="preview" className="w-full h-auto block" />
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox={`0 0 100 100`}
                    preserveAspectRatio="none"
                  >
                    {Array.from({ length: cols - 1 }).map((_, i) => (
                      <line
                        key={`v${i}`}
                        x1={`${((i + 1) / cols) * 100}%`}
                        y1="0"
                        x2={`${((i + 1) / cols) * 100}%`}
                        y2="100%"
                        stroke="#ef4444"
                        strokeWidth="0.5"
                        strokeDasharray="3 2"
                      />
                    ))}
                    {Array.from({ length: rows - 1 }).map((_, i) => (
                      <line
                        key={`h${i}`}
                        x1="0"
                        y1={`${((i + 1) / rows) * 100}%`}
                        x2="100%"
                        y2={`${((i + 1) / rows) * 100}%`}
                        stroke="#ef4444"
                        strokeWidth="0.5"
                        strokeDasharray="3 2"
                      />
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-sm text-slate-400">
                  无选中图片
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSplitAndDownload}
              disabled={!originalImg}
              className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              切割并下载 (ZIP)
            </button>
            <button
              onClick={handleDownloadSingle}
              disabled={!originalImg}
              className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Images className="w-4 h-4" />
              单个下载
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5">
            取消
          </button>
          <button
            onClick={handleSplitAndDownload}
            disabled={!originalImg}
            className="btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
}
