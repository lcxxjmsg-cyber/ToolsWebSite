import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Pipette } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { fileToImage } from '../utils/imageProcessor';

interface RemoveBgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function removeBackground(img: HTMLImageElement, targetColor: { r: number; g: number; b: number }, tolerance: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.sqrt((r - targetColor.r) ** 2 + (g - targetColor.g) ** 2 + (b - targetColor.b) ** 2);
    if (dist <= tolerance * 4.5) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

const checkerboardStyle: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
};

export default function RemoveBgModal({ isOpen, onClose }: RemoveBgModalProps) {
  const { selectedTaskId, tasks } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [targetColor, setTargetColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(30);
  const [previewUrl, setPreviewUrl] = useState('');
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const parseColor = useCallback((hex: string): { r: number; g: number; b: number } => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }, []);

  const generatePreview = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      const blob = await removeBackground(img, parseColor(targetColor), tolerance);
      const url = URL.createObjectURL(blob);
      const prev = previewUrl;
      setPreviewUrl(url);
      if (prev) URL.revokeObjectURL(prev);
    } catch {
      // ignore preview errors
    }
  }, [targetColor, tolerance, parseColor, previewUrl]);

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
    setPreviewUrl('');
    imgRef.current = null;
    setTargetColor('#ffffff');
    setTolerance(30);

    if (!isOpen || !selectedTask) return;

    fileToImage(selectedTask.file).then((img) => {
      imgRef.current = img;
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        generatePreview();
    });
  }, [isOpen, selectedTask, generatePreview]);

  useEffect(() => {
    generatePreview();
  }, [targetColor, tolerance, generatePreview]);

  const handleEyedropper = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!eyedropperActive) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`;
    setTargetColor(hex);
    setEyedropperActive(false);
  }, [eyedropperActive]);

  const handleDownload = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    const blob = await removeBackground(img, parseColor(targetColor), tolerance);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = selectedTask?.fileName.replace(/\.[^.]+$/, '') || 'image';
    a.download = `${baseName}_nobg.png`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, [targetColor, tolerance, parseColor, selectedTask]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-lg glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">去除背景色</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">选择要移除的纯色背景</p>

        {!selectedTask ? (
          <div className="mt-6 text-center py-12 text-slate-400">
            请先选择一张图片
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                目标颜色
              </label>
              <input
                type="color"
                value={targetColor}
                onChange={(e) => setTargetColor(e.target.value)}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0"
              />
              <button
                onClick={() => setEyedropperActive(!eyedropperActive)}
                className={`p-1.5 rounded-lg transition-colors ${
                  eyedropperActive
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="吸管工具"
              >
                <Pipette className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-mono ml-auto">{targetColor}</span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                容差: {tolerance}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value))}
                className="w-full accent-brand-500 mt-1"
              />
            </div>

            <div className="rounded-xl overflow-hidden" style={checkerboardStyle}>
              <canvas
                ref={previewCanvasRef}
                className={`w-full ${eyedropperActive ? 'cursor-crosshair' : ''}`}
                style={{
                  display: previewUrl ? 'none' : 'block',
                  imageRendering: 'auto',
                }}
                onClick={handleEyedropper}
              />
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="w-full"
                    style={{ imageRendering: 'auto' }}
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
                className="btn-primary text-sm py-2.5 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载透明 PNG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
