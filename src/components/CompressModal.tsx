import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { CompressSettings } from '../types/index';

interface CompressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getQualityColor(q: number) {
  if (q >= 80) return 'text-emerald-500';
  if (q >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getQualityBg(q: number) {
  if (q >= 80) return 'bg-emerald-500';
  if (q >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function CompressModal({ isOpen, onClose }: CompressModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [mode, setMode] = useState<CompressSettings['mode']>('quality');
  const [quality, setQuality] = useState(80);
  const [targetSizeKB, setTargetSizeKB] = useState(500);

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
    const cs = selectedTask.settings.compress;
    setMode(cs.mode);
    setQuality(cs.quality);
    if (cs.targetSizeKB != null) setTargetSizeKB(cs.targetSizeKB);
  }, [isOpen, selectedTask]);

  const estimatedPercent = mode === 'quality' ? Math.max(5, quality - 10 + Math.round(quality * 0.15)) : null;

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    const settings: CompressSettings = {
      mode,
      quality,
      ...(mode === 'targetSize' ? { targetSizeKB } : {}),
    };
    updateTaskSettings(selectedTaskId, { compress: settings });
    updateAllTasksSettings({ compress: settings });
    onClose();
  }, [selectedTaskId, mode, quality, targetSizeKB, updateTaskSettings, updateAllTasksSettings, onClose]);

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">压缩图片</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">选择压缩模式并调整参数</p>

        <div className="mt-6 space-y-5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {([
              { key: 'quality' as const, label: '有损质量' },
              { key: 'targetSize' as const, label: '目标大小' },
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

          {mode === 'quality' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">压缩质量</span>
                <span className={`text-2xl font-bold tabular-nums ${getQualityColor(quality)}`}>
                  {quality}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full accent-brand-500"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`,
                  height: '6px',
                  borderRadius: '3px',
                  appearance: 'none',
                }}
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span className="text-red-500">低质量</span>
                <span className="text-amber-500">中等</span>
                <span className="text-emerald-500">高质量</span>
              </div>
              {estimatedPercent != null && (
                <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">预估输出大小</span>
                    <span className={`font-medium ${getQualityColor(quality)}`}>
                      约 {estimatedPercent}% 原大小
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getQualityBg(quality)}`}
                      style={{ width: `${estimatedPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'targetSize' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">目标文件大小 (KB)</label>
                <input
                  type="number"
                  min={1}
                  value={targetSizeKB || ''}
                  onChange={(e) => setTargetSizeKB(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full input-field text-sm py-2 mt-1"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                自动调整质量以达到目标文件大小。实际结果可能略有偏差。
              </p>
              {selectedTask && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  原始大小: {(selectedTask.originalSize / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
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
  );
}
