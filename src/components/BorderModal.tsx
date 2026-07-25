import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { BorderSettings } from '../types/index';

interface BorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BorderModal({ isOpen, onClose }: BorderModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [width, setWidth] = useState(10);
  const [color, setColor] = useState('#6366f1');
  const [radius, setRadius] = useState(20);

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
    const bs = selectedTask.settings.border;
    if (bs) {
      setWidth(bs.width);
      setColor(bs.color);
      setRadius(bs.radius);
    }
  }, [isOpen, selectedTask]);

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    const settings: BorderSettings = {
      width,
      color,
      radius,
    };
    updateTaskSettings(selectedTaskId, { border: settings });
    updateAllTasksSettings({ border: settings });
    onClose();
  }, [selectedTaskId, width, color, radius, updateTaskSettings, updateAllTasksSettings, onClose]);

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">添加边框</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">调整边框样式参数</p>

        <div className="mt-6 space-y-5">
          <div
            className="flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all duration-200"
          >
            <div
              className="w-40 h-40 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center transition-all duration-200"
              style={{
                border: `${width}px solid ${color}`,
                borderRadius: `${radius}px`,
              }}
            >
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-500/20 mx-auto" />
                <div className="mt-2 w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-600 mx-auto" />
                <div className="mt-1.5 w-12 h-2 rounded-full bg-slate-200 dark:bg-slate-600 mx-auto" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                边框宽度
              </label>
              <span className="text-sm tabular-nums font-mono text-slate-500 dark:text-slate-400">
                {width}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0px</span>
              <span>50px</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                边框颜色
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{color}</span>
              <div className="flex gap-1.5">
                {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'].map(
                  (presetColor) => (
                    <button
                      key={presetColor}
                      onClick={() => setColor(presetColor)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        color === presetColor
                          ? 'border-slate-900 dark:border-white scale-110'
                          : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: presetColor }}
                      aria-label={presetColor}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                圆角半径
              </label>
              <span className="text-sm tabular-nums font-mono text-slate-500 dark:text-slate-400">
                {radius}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0px</span>
              <span>100px</span>
            </div>
          </div>
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
