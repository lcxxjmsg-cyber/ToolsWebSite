import { useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';
import type { TaskItem } from '../types/index';
import { formatSize } from '../utils/formatUtils';
import { useTaskStore } from '../store/taskStore';

interface TaskCardProps {
  task: TaskItem;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { removeTask, selectedTaskId } = useTaskStore();
  const isSelected = selectedTaskId === task.id;

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeTask(task.id);
    },
    [removeTask, task.id],
  );

  const getOutputFormatLabel = (fmt: string) => {
    const labels: Record<string, string> = {
      png: 'PNG',
      jpeg: 'JPEG',
      jpg: 'JPEG',
      webp: 'WebP',
      gif: 'GIF',
      bmp: 'BMP',
      ico: 'ICO',
      tiff: 'TIFF',
      avif: 'AVIF',
    };
    return labels[fmt.toLowerCase()] ?? fmt.toUpperCase();
  };

  const statusBorderColor =
    task.status === 'completed'
      ? 'border-emerald-500 ring-1 ring-emerald-500/30'
      : task.status === 'error'
        ? 'border-red-500 ring-1 ring-red-500/30'
        : task.status === 'processing'
          ? 'border-brand-500 ring-1 ring-brand-500/30'
          : isSelected
            ? 'border-brand-400 dark:border-brand-500 ring-2 ring-brand-500/20'
            : 'border-slate-200 dark:border-slate-700';

  return (
    <div
      onClick={onClick}
      className={`card group flex items-stretch gap-3 p-3 cursor-pointer min-w-[200px] transition-all duration-200 ${statusBorderColor}`}
    >
      <div className="relative w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
        {task.thumbnail ? (
          <img
            src={task.thumbnail}
            alt={task.fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          </div>
        )}

        {task.status === 'processing' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <span
            className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]"
            title={task.fileName}
          >
            {task.fileName}
          </span>

          <button
            onClick={handleDelete}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all duration-150 flex-shrink-0"
            aria-label="删除任务"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500">
            {formatSize(task.originalSize)}
          </span>
          {task.resultSize != null && task.resultSize !== task.originalSize && (
            <span className="text-emerald-500">→ {formatSize(task.resultSize)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
            {task.originalFormat}
          </span>

          {task.settings.outputFormat !==
            task.originalFormat.toLowerCase() && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase">
              → {getOutputFormatLabel(task.settings.outputFormat)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center flex-shrink-0">
        {task.status === 'pending' && (
          <Clock className="w-4 h-4 text-slate-400" />
        )}
        {task.status === 'processing' && (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
            <span className="text-[10px] text-brand-500 font-medium">
              {Math.round(task.progress)}%
            </span>
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}
        {task.status === 'completed' && (
          <div className="flex flex-col items-center gap-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-emerald-500 font-medium">完成</span>
          </div>
        )}
        {task.status === 'error' && (
          <div className="flex flex-col items-center gap-0.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span
              className="text-[10px] text-red-500 font-medium max-w-[60px] truncate"
              title={task.errorMessage}
            >
              {task.errorMessage || '错误'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
