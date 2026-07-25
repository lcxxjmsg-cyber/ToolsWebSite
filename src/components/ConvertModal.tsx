import { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { ImageFormat } from '../types/index';
import { SUPPORTED_OUTPUT_FORMATS } from '../types/index';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormatInfo {
  label: string;
  transparency: boolean;
  compression: string;
  lossy: boolean;
}

const FORMAT_INFO: Record<string, FormatInfo> = {
  png: { label: 'PNG', transparency: true, compression: '无损压缩', lossy: false },
  jpeg: { label: 'JPEG', transparency: false, compression: '有损压缩', lossy: true },
  jpg: { label: 'JPEG', transparency: false, compression: '有损压缩', lossy: true },
  webp: { label: 'WebP', transparency: true, compression: '有损/无损', lossy: true },
  gif: { label: 'GIF', transparency: true, compression: '无损压缩', lossy: false },
  bmp: { label: 'BMP', transparency: false, compression: '无压缩', lossy: false },
  ico: { label: 'ICO', transparency: true, compression: '无损压缩', lossy: false },
  tiff: { label: 'TIFF', transparency: true, compression: '无损压缩', lossy: false },
  avif: { label: 'AVIF', transparency: true, compression: '有损/无损', lossy: true },
  pdf: { label: 'PDF', transparency: false, compression: '图片嵌入', lossy: false },
};

const LOSSY_FORMATS: ImageFormat[] = ['jpeg', 'jpg', 'webp', 'avif'];

export default function ConvertModal({ isOpen, onClose }: ConvertModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(80);
  const [showLossyQuality, setShowLossyQuality] = useState(false);

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
    setTargetFormat(selectedTask.settings.outputFormat);
    setQuality(selectedTask.settings.compress.quality);
  }, [isOpen, selectedTask]);

  useEffect(() => {
    setShowLossyQuality(LOSSY_FORMATS.includes(targetFormat));
  }, [targetFormat]);

  const selectedFormatInfo = FORMAT_INFO[targetFormat];
  const sortedFormats = [...new Set(SUPPORTED_OUTPUT_FORMATS)].sort((a, b) => {
    const ai = FORMAT_INFO[a]?.label ?? '';
    const bi = FORMAT_INFO[b]?.label ?? '';
    if (a === targetFormat) return -1;
    if (b === targetFormat) return 1;
    return ai.localeCompare(bi);
  });

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    updateTaskSettings(selectedTaskId, {
      outputFormat: targetFormat,
      ...(showLossyQuality ? { compress: { mode: 'quality' as const, quality } } : {}),
    });
    updateAllTasksSettings({
      outputFormat: targetFormat,
      ...(showLossyQuality ? { compress: { mode: 'quality' as const, quality } } : {}),
    });
    onClose();
  }, [selectedTaskId, targetFormat, quality, showLossyQuality, updateTaskSettings, updateAllTasksSettings, onClose]);

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">格式转换</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">选择目标输出格式</p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {sortedFormats.map((fmt) => {
              const info = FORMAT_INFO[fmt];
              const isSelected = targetFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => setTargetFormat(fmt)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {info?.label ?? fmt.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {info?.compression ?? ''}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedFormatInfo && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedFormatInfo.label}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  透明背景: {selectedFormatInfo.transparency ? '✅ 支持' : '❌ 不支持'}
                </span>
                <span>压缩方式: {selectedFormatInfo.compression}</span>
              </div>
            </div>
          )}

          {showLossyQuality && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">输出质量</label>
                <span className="text-sm tabular-nums font-mono text-slate-500 dark:text-slate-400">
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
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>低</span>
                <span>高</span>
              </div>
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
