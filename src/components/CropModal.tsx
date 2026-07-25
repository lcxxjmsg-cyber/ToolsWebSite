import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { CropSettings } from '../types/index';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function CropModal({ isOpen, onClose }: CropModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const thumbnail = selectedTask?.thumbnail ?? '';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);

  const [presetRatio, setPresetRatio] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragCorner, setDragCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | 'move' | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  const [inputX, setInputX] = useState('0');
  const [inputY, setInputY] = useState('0');
  const [inputW, setInputW] = useState('0');
  const [inputH, setInputH] = useState('0');
  const [imgLoaded, setImgLoaded] = useState(false);

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
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const preventDefault = (e: Event) => e.preventDefault();
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, [isOpen, imgLoaded]);

  const loadAndSetup = useCallback(() => {
    if (!isOpen || !thumbnail) {
      imgRef.current = null;
      setImgLoaded(false);
      setImgNatural({ w: 0, h: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setImgNatural({ w: nw, h: nh });

      const existingCrop = selectedTask?.settings.crop;
      if (existingCrop && existingCrop.width > 0 && existingCrop.height > 0) {
        setCropX(existingCrop.x);
        setCropY(existingCrop.y);
        setCropW(existingCrop.width);
        setCropH(existingCrop.height);
        if (existingCrop.aspectRatio != null) {
          setPresetRatio(existingCrop.aspectRatio);
        } else {
          setPresetRatio(null);
        }
      } else {
        setCropX(0);
        setCropY(0);
        setCropW(nw);
        setCropH(nh);
        setPresetRatio(null);
      }
      setImgLoaded(true);
    };
    img.onerror = () => {
      imgRef.current = null;
      setImgLoaded(false);
    };
    img.src = thumbnail;
  }, [isOpen, thumbnail, selectedTask?.settings.crop]);

  useEffect(() => {
    loadAndSetup();
  }, [loadAndSetup]);

  useEffect(() => {
    if (!imgLoaded || imgNatural.w === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const maxW = container.clientWidth - 16;
    const maxH = Math.min(500, window.innerHeight * 0.45);

    let dw: number, dh: number;
    const ar = imgNatural.w / imgNatural.h;
    if (maxW / maxH > ar) {
      dh = maxH;
      dw = dh * ar;
    } else {
      dw = maxW;
      dh = dw / ar;
    }
    dw = Math.round(dw);
    dh = Math.round(dh);

    setDisplaySize({ w: dw, h: dh });
    setScale(dw / imgNatural.w);
    setOffset({ x: 0, y: 0 });
  }, [imgLoaded, imgNatural]);

  useEffect(() => {
    setInputX(String(Math.round(cropX)));
    setInputY(String(Math.round(cropY)));
    setInputW(String(Math.round(cropW)));
    setInputH(String(Math.round(cropH)));
  }, [cropX, cropY, cropW, cropH]);

  const imgToDisplay = useCallback(
    (ix: number, iy: number) => ({
      dx: offset.x + ix * scale,
      dy: offset.y + iy * scale,
    }),
    [offset, scale],
  );

  const displayToImg = useCallback(
    (dx: number, dy: number) => ({
      ix: (dx - offset.x) / scale,
      iy: (dy - offset.y) / scale,
    }),
    [offset, scale],
  );

  const constrainCrop = useCallback(
    (x: number, y: number, w: number, h: number) => {
      let cx = clamp(x, 0, imgNatural.w - 1);
      let cy = clamp(y, 0, imgNatural.h - 1);
      let cw = clamp(w, 10, imgNatural.w - cx);
      let ch = clamp(h, 10, imgNatural.h - cy);
      if (presetRatio != null && presetRatio > 0) {
        ch = cw / presetRatio;
        if (cy + ch > imgNatural.h) {
          ch = imgNatural.h - cy;
          cw = ch * presetRatio;
        }
        if (cx + cw > imgNatural.w) {
          cw = imgNatural.w - cx;
          ch = cw / presetRatio;
        }
        cw = Math.max(10, cw);
        ch = Math.max(10, ch);
      }
      return { x: cx, y: cy, w: cw, h: ch };
    },
    [imgNatural, presetRatio],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = displaySize.w;
    canvas.height = displaySize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offset.x, offset.y, displaySize.w, displaySize.h);

    const { dx: cx, dy: cy } = imgToDisplay(cropX, cropY);
    const dw = cropW * scale;
    const dh = cropH * scale;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, cy);
    ctx.fillRect(0, cy + dh, canvas.width, canvas.height - cy - dh);
    ctx.fillRect(0, cy, cx, dh);
    ctx.fillRect(cx + dw, cy, canvas.width - cx - dw, dh);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(cx, cy, dw, dh);
    ctx.setLineDash([]);

    ctx.fillStyle = '#6366f1';
    const handleR = 5;
    [
      [cx, cy],
      [cx + dw, cy],
      [cx, cy + dh],
      [cx + dw, cy + dh],
    ].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, handleR, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [displaySize, offset, scale, cropX, cropY, cropW, cropH, imgToDisplay]);

  useEffect(() => {
    if (imgLoaded && displaySize.w > 0) {
      draw();
    }
  }, [imgLoaded, displaySize, draw]);

  const getHandle = useCallback(
    (canvasX: number, canvasY: number): 'tl' | 'tr' | 'bl' | 'br' | 'move' | null => {
      const { dx: cx, dy: cy } = imgToDisplay(cropX, cropY);
      const dw = cropW * scale;
      const dh = cropH * scale;
      const threshold = 12;

      const corners: [string, number, number][] = [
        ['tl', cx, cy],
        ['tr', cx + dw, cy],
        ['bl', cx, cy + dh],
        ['br', cx + dw, cy + dh],
      ];

      for (const [name, hx, hy] of corners) {
        if (Math.abs(canvasX - hx) < threshold && Math.abs(canvasY - hy) < threshold) {
          return name as 'tl' | 'tr' | 'bl' | 'br';
        }
      }

      if (canvasX >= cx && canvasX <= cx + dw && canvasY >= cy && canvasY <= cy + dh) {
        return 'move';
      }
      return null;
    },
    [cropX, cropY, cropW, cropH, scale, imgToDisplay],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const corner = getHandle(mx, my);
      if (!corner) {
        const { ix, iy } = displayToImg(mx, my);
        setCropX(clamp(ix, 0, imgNatural.w - 1));
        setCropY(clamp(iy, 0, imgNatural.h - 1));
        setCropW(10);
        setCropH(10);
        setDragCorner('br');
      } else {
        setDragCorner(corner);
      }
      setDragStart({ mx, my, cx: cropX, cy: cropY, cw: cropW, ch: cropH });
      setDragging(true);
    },
    [cropX, cropY, cropW, cropH, displayToImg, imgNatural, getHandle],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragging) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const ddx = mx - dragStart.mx;
      const ddy = my - dragStart.my;
      const di = displayToImg(ddx, ddy);

      let nx = dragStart.cx;
      let ny = dragStart.cy;
      let nw = dragStart.cw;
      let nh = dragStart.ch;

      switch (dragCorner) {
        case 'br':
          nw = dragStart.cw + di.ix;
          nh = dragStart.ch + di.iy;
          break;
        case 'tl':
          nx = dragStart.cx + di.ix;
          ny = dragStart.cy + di.iy;
          nw = dragStart.cw - di.ix;
          nh = dragStart.ch - di.iy;
          break;
        case 'tr':
          ny = dragStart.cy + di.iy;
          nw = dragStart.cw + di.ix;
          nh = dragStart.ch - di.iy;
          break;
        case 'bl':
          nx = dragStart.cx + di.ix;
          nw = dragStart.cw - di.ix;
          nh = dragStart.ch + di.iy;
          break;
        case 'move':
          nx = dragStart.cx + di.ix;
          ny = dragStart.cy + di.iy;
          break;
      }

      const constrained = constrainCrop(nx, ny, Math.max(10, nw), Math.max(10, nh));
      setCropX(constrained.x);
      setCropY(constrained.y);
      setCropW(constrained.w);
      setCropH(constrained.h);
    },
    [dragging, dragStart, dragCorner, displayToImg, constrainCrop],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setDragCorner(null);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;
      const corner = getHandle(mx, my);
      if (!corner) {
        const { ix, iy } = displayToImg(mx, my);
        setCropX(clamp(ix, 0, imgNatural.w - 1));
        setCropY(clamp(iy, 0, imgNatural.h - 1));
        setCropW(10);
        setCropH(10);
        setDragCorner('br');
      } else {
        setDragCorner(corner);
      }
      setDragStart({ mx, my, cx: cropX, cy: cropY, cw: cropW, ch: cropH });
      setDragging(true);
    },
    [cropX, cropY, cropW, cropH, displayToImg, imgNatural, getHandle],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!dragging) return;
      const canvas = canvasRef.current;
      if (!canvas || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;

      const ddx = mx - dragStart.mx;
      const ddy = my - dragStart.my;
      const di = displayToImg(ddx, ddy);

      let nx = dragStart.cx;
      let ny = dragStart.cy;
      let nw = dragStart.cw;
      let nh = dragStart.ch;

      switch (dragCorner) {
        case 'br':
          nw = dragStart.cw + di.ix;
          nh = dragStart.ch + di.iy;
          break;
        case 'tl':
          nx = dragStart.cx + di.ix;
          ny = dragStart.cy + di.iy;
          nw = dragStart.cw - di.ix;
          nh = dragStart.ch - di.iy;
          break;
        case 'tr':
          ny = dragStart.cy + di.iy;
          nw = dragStart.cw + di.ix;
          nh = dragStart.ch - di.iy;
          break;
        case 'bl':
          nx = dragStart.cx + di.ix;
          nw = dragStart.cw - di.ix;
          nh = dragStart.ch + di.iy;
          break;
        case 'move':
          nx = dragStart.cx + di.ix;
          ny = dragStart.cy + di.iy;
          break;
      }

      const constrained = constrainCrop(nx, ny, Math.max(10, nw), Math.max(10, nh));
      setCropX(constrained.x);
      setCropY(constrained.y);
      setCropW(constrained.w);
      setCropH(constrained.h);
    },
    [dragging, dragStart, dragCorner, displayToImg, constrainCrop],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setDragging(false);
      setDragCorner(null);
    },
    [],
  );

  const handlePresetChange = useCallback(
    (ratio: number | null) => {
      setPresetRatio(ratio);
      if (ratio != null && ratio > 0) {
        const newH = cropW / ratio;
        if (cropY + newH > imgNatural.h) {
          const fittedH = imgNatural.h - cropY;
          setCropW(Math.max(10, fittedH * ratio));
          setCropH(fittedH);
        } else {
          setCropH(Math.max(10, newH));
        }
      }
    },
    [cropW, cropY, imgNatural],
  );

  const handleManualChange = useCallback(
    (field: string, value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) return;
      switch (field) {
        case 'x':
          setCropX(clamp(num, 0, imgNatural.w - 1));
          setInputX(value);
          break;
        case 'y':
          setCropY(clamp(num, 0, imgNatural.h - 1));
          setInputY(value);
          break;
        case 'w':
          setCropW(clamp(num, 1, imgNatural.w - cropX));
          setInputW(value);
          break;
        case 'h':
          setCropH(clamp(num, 1, imgNatural.h - cropY));
          setInputH(value);
          break;
      }
    },
    [imgNatural, cropX, cropY],
  );

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    const settings: CropSettings = {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH),
      aspectRatio: presetRatio ?? undefined,
    };
    updateTaskSettings(selectedTaskId, { crop: settings });
    updateAllTasksSettings({ crop: settings });
    onClose();
  }, [selectedTaskId, cropX, cropY, cropW, cropH, presetRatio, updateTaskSettings, updateAllTasksSettings, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-3xl glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">裁剪图片</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">拖拽选取裁剪区域，或使用预设比例</p>

        {!imgLoaded || !thumbnail ? (
          <div className="mt-6 flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
            请先选择一张图片任务
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4 flex-1 min-h-0 overflow-auto">
            <div
              ref={containerRef}
              className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                width={displaySize.w}
                height={displaySize.h}
                style={{ width: displaySize.w, height: displaySize.h, cursor: dragging ? 'grabbing' : 'crosshair', touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="max-w-full"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_RATIOS.map((pr) => (
                <button
                  key={pr.label}
                  onClick={() => handlePresetChange(pr.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    presetRatio === pr.value
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['x', 'y', 'w', 'h'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase">
                    {field === 'w' ? '宽' : field === 'h' ? '高' : field.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={
                      field === 'x' ? inputX : field === 'y' ? inputY : field === 'w' ? inputW : inputH
                    }
                    onChange={(e) => handleManualChange(field, e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary text-sm py-2.5">
            取消
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedTaskId || !imgLoaded}
            className="btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            应用裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
