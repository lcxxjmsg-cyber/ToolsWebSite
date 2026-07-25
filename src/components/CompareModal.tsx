import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Columns2, Rows3, SlidersHorizontal } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CompareMode = 'sideBySide' | 'stacked' | 'slider';

export default function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const { tasks } = useTaskStore();

  const [imgAId, setImgAId] = useState<string | null>(null);
  const [imgBId, setImgBId] = useState<string | null>(null);
  const [mode, setMode] = useState<CompareMode>('sideBySide');
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const sliderContainerRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen || tasks.length < 2) return;
    setImgAId((prev) => prev && tasks.some((t) => t.id === prev) ? prev : tasks[0].id);
    setImgBId((prev) => prev && tasks.some((t) => t.id === prev) ? prev : tasks[1].id);
  }, [isOpen, tasks]);

  const taskA = tasks.find((t) => t.id === imgAId);
  const taskB = tasks.find((t) => t.id === imgBId);

  const imgA = taskA?.file || null;
  const imgB = taskB?.file || null;

  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');

  useEffect(() => {
    if (imgA) {
      const u = URL.createObjectURL(imgA);
      setUrlA(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setUrlA('');
    }
  }, [imgA]);

  useEffect(() => {
    if (imgB) {
      const u = URL.createObjectURL(imgB);
      setUrlB(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setUrlB('');
    }
  }, [imgB]);

  const handleSliderMove = useCallback((clientX: number) => {
    const container = sliderContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => handleSliderMove(e.clientX);
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, handleSliderMove]);

  useEffect(() => {
    const container = sliderContainerRef.current;
    if (!container) return;

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      handleSliderMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => setDragging(false);

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging, handleSliderMove]);

  const handleDownload = useCallback(() => {
    if (!urlA || !urlB) return;
    const canvas = document.createElement('canvas');
    const img1 = new Image();
    const img2 = new Image();
    let loaded = 0;

    const draw = () => {
      loaded++;
      if (loaded < 2) return;

      if (mode === 'sideBySide') {
        canvas.width = img1.naturalWidth + img2.naturalWidth;
        canvas.height = Math.max(img1.naturalHeight, img2.naturalHeight);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img1, 0, 0, img1.naturalWidth, canvas.height);
        ctx.drawImage(img2, img1.naturalWidth, 0, img2.naturalWidth, canvas.height);
      } else if (mode === 'stacked') {
        canvas.width = Math.max(img1.naturalWidth, img2.naturalWidth);
        canvas.height = img1.naturalHeight + img2.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img1, 0, 0, canvas.width, img1.naturalHeight);
        ctx.drawImage(img2, 0, img1.naturalHeight, canvas.width, img2.naturalHeight);
      } else {
        canvas.width = Math.max(img1.naturalWidth, img2.naturalWidth);
        canvas.height = Math.max(img1.naturalHeight, img2.naturalHeight);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img1, 0, 0, canvas.width, canvas.height);
        const splitX = Math.round((sliderPos / 100) * canvas.width);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, canvas.height);
        ctx.clip();
        ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `compare_${Date.now()}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };

    img1.onload = draw;
    img2.onload = draw;
    img1.src = urlA;
    img2.src = urlB;
  }, [urlA, urlB, mode, sliderPos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-4xl glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">图片对比</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">选择两张图片进行对比</p>

        {tasks.length < 2 ? (
          <div className="mt-6 text-center py-12 text-slate-400">
            需要至少上传两张图片
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">图片A</label>
                <div className="mt-1 grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setImgAId(t.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        imgAId === t.id
                          ? 'border-brand-500 shadow-sm'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt={t.fileName} className="w-full h-16 object-cover" />
                      ) : (
                        <div className="w-full h-16 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                          无预览
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate px-1 py-0.5">{t.fileName}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">图片B</label>
                <div className="mt-1 grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setImgBId(t.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        imgBId === t.id
                          ? 'border-brand-500 shadow-sm'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt={t.fileName} className="w-full h-16 object-cover" />
                      ) : (
                        <div className="w-full h-16 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                          无预览
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate px-1 py-0.5">{t.fileName}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
              {([
                { key: 'sideBySide' as const, label: '左右对比', icon: Columns2 },
                { key: 'stacked' as const, label: '上下对比', icon: Rows3 },
                { key: 'slider' as const, label: '滑块对比', icon: SlidersHorizontal },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    mode === opt.key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            {urlA && urlB && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-center">
                {mode === 'sideBySide' && (
                  <div className="flex gap-2 max-h-[400px]">
                    <div className="flex-1 max-w-[50%]">
                      <img src={urlA} alt="A" className="w-full max-h-[400px] object-contain rounded-lg" />
                    </div>
                    <div className="flex-1 max-w-[50%]">
                      <img src={urlB} alt="B" className="w-full max-h-[400px] object-contain rounded-lg" />
                    </div>
                  </div>
                )}

                {mode === 'stacked' && (
                  <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                    <div className="max-h-[250px]">
                      <img src={urlA} alt="A" className="w-full max-h-[250px] object-contain rounded-lg" />
                    </div>
                    <div className="max-h-[250px]">
                      <img src={urlB} alt="B" className="w-full max-h-[250px] object-contain rounded-lg" />
                    </div>
                  </div>
                )}

                {mode === 'slider' && (
                  <div
                    ref={sliderContainerRef}
                    className="relative w-full select-none touch-none"
                    style={{ maxHeight: '400px' }}
                  >
                    <img src={urlA} alt="A" className="w-full max-h-[400px] object-contain rounded-lg" />
                    <div
                      className="absolute top-0 left-0 bottom-0 overflow-hidden rounded-l-lg"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img src={urlB} alt="B" className="w-full max-h-[400px] object-contain" />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md cursor-ew-resize flex items-center justify-center"
                      style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                        <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={onClose} className="btn-secondary text-sm py-2.5">
                取消
              </button>
              <button
                onClick={handleDownload}
                disabled={!urlA || !urlB}
                className="btn-primary text-sm py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                下载对比图
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
