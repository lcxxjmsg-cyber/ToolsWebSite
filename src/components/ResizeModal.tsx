import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Link, Link2Off } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { ResizeSettings } from '../types/index';

interface ResizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  applyToAll?: boolean;
}

export default function ResizeModal({ isOpen, onClose, applyToAll = false }: ResizeModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [mode, setMode] = useState<ResizeSettings['mode']>('percent');
  const [percent, setPercent] = useState(100);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [fitWidth, setFitWidth] = useState(0);
  const [fitHeight, setFitHeight] = useState(0);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain');

  const [originalW, setOriginalW] = useState(0);
  const [originalH, setOriginalH] = useState(0);
  const aspectRatio = originalH > 0 ? originalW / originalH : 1;
  const loadedRef = useRef(false);

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
    if (!isOpen || !selectedTask?.thumbnail) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setOriginalW(nw);
      setOriginalH(nh);

      const existing = selectedTask.settings.resize;
      if (existing) {
        setMode(existing.mode);
        if (existing.percent != null) setPercent(existing.percent);
        if (existing.width != null) setWidth(existing.width);
        if (existing.height != null) setHeight(existing.height);
        setLockAspectRatio(existing.lockAspectRatio);
        if (existing.fitWidth != null) setFitWidth(existing.fitWidth);
        if (existing.fitHeight != null) setFitHeight(existing.fitHeight);
        if (existing.fitMode) setFitMode(existing.fitMode);
      } else {
        setWidth(nw);
        setHeight(nh);
        setFitWidth(nw);
        setFitHeight(nh);
      }
    };
    img.src = selectedTask.thumbnail;
  }, [isOpen, selectedTask]);

  const handleWidthChange = useCallback(
    (val: number) => {
      setWidth(val);
      if (lockAspectRatio) {
        setHeight(Math.round(val / aspectRatio));
      }
    },
    [lockAspectRatio, aspectRatio],
  );

  const handleHeightChange = useCallback(
    (val: number) => {
      setHeight(val);
      if (lockAspectRatio) {
        setWidth(Math.round(val * aspectRatio));
      }
    },
    [lockAspectRatio, aspectRatio],
  );

  const computedW = mode === 'percent' ? Math.round((originalW * percent) / 100) : width;
  const computedH = mode === 'percent' ? Math.round((originalH * percent) / 100) : height;

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    const settings: ResizeSettings = {
      mode,
      lockAspectRatio,
      ...(mode === 'percent' ? { percent } : {}),
      ...(mode === 'pixels' ? { width, height } : {}),
      ...(mode === 'fit' ? { fitWidth, fitHeight, fitMode } : {}),
    };
    updateTaskSettings(selectedTaskId, { resize: settings });
    if (applyToAll) {
      updateAllTasksSettings({ resize: settings });
    }
    onClose();
  }, [selectedTaskId, mode, percent, width, height, lockAspectRatio, fitWidth, fitHeight, fitMode, applyToAll, updateTaskSettings, updateAllTasksSettings, onClose]);

  const handleReset = () => {
    setPercent(100);
    setWidth(originalW);
    setHeight(originalH);
    setFitWidth(originalW);
    setFitHeight(originalH);
    setFitMode('contain');
    setLockAspectRatio(true);
  };

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">调整尺寸</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          原图: {originalW} x {originalH} px
        </p>

        <div className="mt-6 space-y-5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {([
              { key: 'percent' as const, label: '按百分比' },
              { key: 'pixels' as const, label: '按像素' },
              { key: 'fit' as const, label: '适应尺寸' },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMode(opt.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === opt.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {mode === 'percent' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">缩放比例</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={percent}
                    onChange={(e) => setPercent(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                    className="w-20 input-field text-sm py-1.5 text-center"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={percent}
                onChange={(e) => setPercent(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1%</span>
                <span>200%</span>
              </div>
            </div>
          )}

          {mode === 'pixels' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">宽度 (px)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    value={width || ''}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                    className="flex-1 input-field text-sm py-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className={`p-2 rounded-lg transition-colors ${
                    lockAspectRatio
                      ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title={lockAspectRatio ? '解锁比例' : '锁定比例'}
                >
                  {lockAspectRatio ? <Link className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">高度 (px)</label>
                <input
                  type="number"
                  min={1}
                  value={height || ''}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full input-field text-sm py-2 mt-1"
                />
              </div>
            </div>
          )}

          {mode === 'fit' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">目标宽度</label>
                  <input
                    type="number"
                    min={1}
                    value={fitWidth || ''}
                    onChange={(e) => setFitWidth(parseInt(e.target.value) || 1)}
                    className="w-full input-field text-sm py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">目标高度</label>
                  <input
                    type="number"
                    min={1}
                    value={fitHeight || ''}
                    onChange={(e) => setFitHeight(parseInt(e.target.value) || 1)}
                    className="w-full input-field text-sm py-2 mt-1"
                  />
                </div>
              </div>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                {([
                  { key: 'contain' as const, label: '包含 (Contain)' },
                  { key: 'cover' as const, label: '覆盖 (Cover)' },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFitMode(opt.key)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      fitMode === opt.key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {originalW > 0 && (
            <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3 text-center">
              <span className="text-sm text-brand-600 dark:text-brand-400 font-medium">
                {mode === 'fit'
                  ? `输出将适应 ${fitWidth}×${fitHeight} 范围`
                  : `新尺寸: ${computedW} × ${computedH} px`}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            重置
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary text-sm py-2.5">
              取消
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedTaskId}
              className="btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
