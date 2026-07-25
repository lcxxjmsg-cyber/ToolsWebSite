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
  CheckCircle2,
  ScanLine,
  Images,
  Grid3X3,
  Circle,
  FlipHorizontal2,
  Hash,
  Columns2,
  Info,
  Eraser,
  Film,
} from 'lucide-react';
import type { ToolMode } from '../types/index';
import { useTaskStore } from '../store/taskStore';
import { processImage } from '../utils/imageProcessor';
import { createZipFromResults } from '../utils/zipUtils';


interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: typeof Zap;
}

const TOOLS: ToolConfig[] = [
  { mode: 'convert', label: '格式转换', icon: ArrowLeftRight },
  { mode: 'compress', label: '压缩', icon: Zap },
  { mode: 'crop', label: '裁剪', icon: Crop },
  { mode: 'resize', label: '调整尺寸', icon: Maximize2 },
  { mode: 'filter', label: '滤镜', icon: Sparkles },
  { mode: 'watermark', label: '水印', icon: Type },
  { mode: 'border', label: '边框', icon: Square },
  { mode: 'merge', label: '合并', icon: Images },
  { mode: 'split', label: '切割', icon: Grid3X3 },
  { mode: 'roundCorners', label: '圆角', icon: Circle },
  { mode: 'mirror', label: '镜像', icon: FlipHorizontal2 },
  { mode: 'mosaic', label: '马赛克', icon: Hash },
  { mode: 'compare', label: '对比', icon: Columns2 },
  { mode: 'exif', label: '元数据', icon: Info },
  { mode: 'removeBg', label: '去背景', icon: Eraser },
  { mode: 'gif', label: 'GIF', icon: Film },
  { mode: 'ocr', label: '文字识别', icon: ScanLine },
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
  const abortRef = useRef(false);

  const currentFormat = tasks[0]?.settings.outputFormat || 'png';

  const handleToolSelect = (tool: ToolConfig) => {
    setActiveTool(tool.mode);
    updateAllTasksSettings({ activeTool: tool.mode });
    onToolChange?.(tool.mode);
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
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

          <span className="ml-2 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-sm font-medium text-brand-600 dark:text-brand-400 flex-shrink-0">
            → {FORMAT_LABELS[currentFormat] ?? currentFormat.toUpperCase()}
          </span>
        </div>

        {!isProcessing && !hasResults && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {tasks.length === 0
                ? '添加图片后点击"开始处理"'
                : `共 ${tasks.filter((t) => t.status === 'pending').length} 个待处理任务`}
            </div>
            <button
              onClick={handleStartProcessing}
              disabled={tasks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              开始处理
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
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
          </div>
        )}

        {hasResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {completedCount} 个处理完成
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
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

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
