import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { FilterSettings } from '../types/index';
import { DEFAULT_FILTER_SETTINGS } from '../types/index';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterSlider {
  key: keyof FilterSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const FILTER_SLIDERS: FilterSlider[] = [
  { key: 'brightness', label: '亮度', min: 0, max: 200, step: 1 },
  { key: 'contrast', label: '对比度', min: 0, max: 200, step: 1 },
  { key: 'saturation', label: '饱和度', min: 0, max: 200, step: 1 },
  { key: 'hueRotate', label: '色相', min: 0, max: 360, step: 1, unit: '°' },
  { key: 'grayscale', label: '灰度', min: 0, max: 100, step: 1 },
  { key: 'sepia', label: '怀旧', min: 0, max: 100, step: 1 },
  { key: 'blur', label: '模糊', min: 0, max: 20, step: 0.5 },
  { key: 'invert', label: '反相', min: 0, max: 100, step: 1 },
  { key: 'opacity', label: '透明度', min: 0, max: 100, step: 1 },
];

function buildFilterString(f: FilterSettings): string {
  const parts: string[] = [];
  if (f.grayscale) parts.push(`grayscale(${f.grayscale}%)`);
  if (f.sepia) parts.push(`sepia(${f.sepia}%)`);
  if (f.blur) parts.push(`blur(${f.blur}px)`);
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`);
  if (f.hueRotate) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.invert) parts.push(`invert(${f.invert}%)`);
  if (f.opacity !== 100) parts.push(`opacity(${f.opacity}%)`);
  return parts.join(' ');
}

export default function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [filter, setFilter] = useState<FilterSettings>({ ...DEFAULT_FILTER_SETTINGS });
  const previewRef = useRef<HTMLImageElement>(null);

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
    setFilter({ ...selectedTask.settings.filter });
  }, [isOpen, selectedTask]);

  const handleSliderChange = useCallback((key: keyof FilterSettings, value: number) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setFilter({ ...DEFAULT_FILTER_SETTINGS });
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    updateTaskSettings(selectedTaskId, { filter });
    updateAllTasksSettings({ filter });
    onClose();
  }, [selectedTaskId, filter, updateTaskSettings, updateAllTasksSettings, onClose]);

  const filterCss = buildFilterString(filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-2xl glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">滤镜调整</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">调整图片滤镜效果，实时预览</p>

        <div className="mt-4 flex flex-col gap-4 min-h-0">
          {selectedTask?.thumbnail && (
            <div className="flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
              <div className="relative max-w-[200px] max-h-[200px] overflow-hidden rounded-lg">
                <img
                  ref={previewRef}
                  src={selectedTask.thumbnail}
                  alt="滤镜预览"
                  className="max-w-full max-h-[200px] object-contain transition-all duration-200"
                  style={{ filter: filterCss }}
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 pr-1 space-y-4">
            {FILTER_SLIDERS.map((slider) => (
              <div key={slider.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {slider.label}
                  </label>
                  <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400 font-mono">
                    {filter[slider.key]}
                    {slider.unit || ''}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={filter[slider.key]}
                  onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{slider.min}{slider.unit || ''}</span>
                  <span>{slider.max}{slider.unit || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
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
