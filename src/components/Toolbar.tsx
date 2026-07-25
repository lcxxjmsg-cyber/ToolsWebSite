import { useState, useCallback, useRef } from 'react';
import {
  ArrowLeftRight,
  Zap,
  Crop,
  Maximize2,
  Sparkles,
  Type,
  Square,
  Download,
  Archive,
  Play,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type { ImageFormat, ToolMode } from '../types/index';
import { SUPPORTED_OUTPUT_FORMATS, DEFAULT_TASK_SETTINGS } from '../types/index';
import { useTaskStore } from '../store/taskStore';
import { processImage } from '../utils/imageProcessor';
import { createZipFromResults } from '../utils/zipUtils';


interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: typeof ArrowLeftRight;
}

const TOOLS: ToolConfig[] = [
  { mode: 'convert', label: '格式转换', icon: ArrowLeftRight },
  { mode: 'compress', label: '压缩', icon: Zap },
  { mode: 'crop', label: '裁剪', icon: Crop },
  { mode: 'resize', label: '调整尺寸', icon: Maximize2 },
  { mode: 'filter', label: '滤镜', icon: Sparkles },
  { mode: 'watermark', label: '水印', icon: Type },
  { mode: 'border', label: '边框', icon: Square },
];

const FORMAT_LABELS: Record<string, string> = {
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

interface ToolbarProps {
  onToolChange?: (tool: ToolMode) => void;
}

export default function Toolbar({ onToolChange }: ToolbarProps) {
  const {
    tasks,
    isProcessing,
    overallProgress,
    applyToAll,
    setApplyToAll,
    updateAllTasksSettings,
    startProcessing,
    finishProcessing,
    setTaskStatus,
    setTaskProgress,
    setTaskResult,
    getTaskById,
    resetResults,
    replaceWithResults,
  } = useTaskStore();

  const [activeTool, setActiveTool] = useState<ToolMode>('convert');
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('png');
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const abortRef = useRef(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  const handleToolSelect = (tool: ToolConfig) => {
    setActiveTool(tool.mode);
    updateAllTasksSettings({ activeTool: tool.mode });
    onToolChange?.(tool.mode);
  };

  const handleFormatSelect = (fmt: ImageFormat) => {
    setOutputFormat(fmt);
    setFormatDropdownOpen(false);
    if (applyToAll) {
      updateAllTasksSettings({ outputFormat: fmt });
    }
  };

  const handleStartProcessing = useCallback(async () => {
    if (isProcessing || tasks.length === 0) return;

    abortRef.current = false;
    startProcessing();

    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    const totalCount = pendingTasks.length;

    for (let i = 0; i < pendingTasks.length; i++) {
      if (abortRef.current) break;

      const task = pendingTasks[i];
      setTaskStatus(task.id, 'processing');
      setTaskProgress(task.id, 0);

      try {
        const { blob } = await processImage(task.file, task.settings);
        const currentTask = getTaskById(task.id);
        if (currentTask) {
          if (currentTask.resultUrl) {
            URL.revokeObjectURL(currentTask.resultUrl);
          }
        }
        setTaskResult(task.id, blob, blob.size);
        setTaskProgress(task.id, 100);
      } catch (err) {
        setTaskStatus(
          task.id,
          'error',
          err instanceof Error ? err.message : '处理失败',
        );
        setTaskProgress(task.id, 0);
      }

      const indexProgress = ((i + 1) / totalCount) * 100;
      useTaskStore.setState({ overallProgress: indexProgress });
    }

    finishProcessing();
  }, [
    isProcessing,
    tasks,
    startProcessing,
    setTaskStatus,
    setTaskProgress,
    getTaskById,
    setTaskResult,
    finishProcessing,
  ]);

  const handleDownloadAll = useCallback(() => {
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.resultBlob,
    );
    if (completedTasks.length === 0) return;

    completedTasks.forEach((task) => {
      if (!task.resultBlob) return;
      const url = URL.createObjectURL(task.resultBlob);

      const baseName = task.fileName.replace(/\.[^.]+$/, '');
      const ext = task.settings.outputFormat || 'png';
      const downloadName = `${baseName}.${ext}`;

      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }, [tasks]);

  const handleDownloadZip = useCallback(async () => {
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.resultBlob,
    );
    if (completedTasks.length === 0) return;

    const results = completedTasks.map((task) => {
      const baseName = task.fileName.replace(/\.[^.]+$/, '');
      const ext = task.settings.outputFormat || 'png';
      return {
        fileName: `${baseName}.${ext}`,
        blob: task.resultBlob!,
      };
    });

    try {
      const zipBlob = await createZipFromResults(results);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }, [tasks]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const hasResults = completedCount > 0;

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.mode;
            return (
              <button
                key={tool.mode}
                onClick={() => handleToolSelect(tool)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tool.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div ref={formatDropdownRef} className="relative">
            <button
              onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="点击选择输出格式"
            >
              转为: {FORMAT_LABELS[outputFormat] ?? outputFormat.toUpperCase()}
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>

            {formatDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1a1a] shadow-lg py-1 z-40 animate-scale-in">
                {SUPPORTED_OUTPUT_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleFormatSelect(fmt)}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      outputFormat === fmt
                        ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {FORMAT_LABELS[fmt] ?? fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={() => {
                  const next = !applyToAll;
                  setApplyToAll(next);
                  if (next) {
                    updateAllTasksSettings({
                      outputFormat,
                      activeTool,
                    });
                  }
                }}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors ${
                  applyToAll ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                    applyToAll ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
            应用到全部
            <span className="text-xs text-slate-400 ml-1">(将当前设置应用到所有任务)</span>
          </label>

          <button
            onClick={() => updateAllTasksSettings({ ...DEFAULT_TASK_SETTINGS })}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm text-slate-600 dark:text-slate-400 transition-colors"
          >
            重置设置
          </button>

          {isProcessing && (
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex-1 min-w-[120px] h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${Math.round(overallProgress)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-brand-500 tabular-nums">
                {Math.round(overallProgress)}%
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {hasResults && (
              <>
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  全部下载
                </button>
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  打包下载ZIP
                </button>
                <button
                  onClick={() => replaceWithResults()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  以结果继续
                </button>
                <button
                  onClick={() => resetResults()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新处理
                </button>
              </>
            )}

            <button
              onClick={handleStartProcessing}
              disabled={isProcessing || tasks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  开始处理
                </>
              )}
            </button>
          </div>
        </div>

        {tasks.length > 0 && !isProcessing && !hasResults && (
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {tasks.length === 0
              ? '添加图片后点击"开始处理"'
              : `共 ${tasks.filter((t) => t.status === 'pending').length} 个待处理任务`}
          </div>
        )}
      </div>
    </div>
  );
}
