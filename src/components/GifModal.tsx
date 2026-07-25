import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Play, Pause, Image, Film } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { fileToImage } from '../utils/imageProcessor';

interface GifModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GifFrame {
  canvas: HTMLCanvasElement;
  delay: number;
}

type GifMode = 'extract' | 'compose';

export default function GifModal({ isOpen, onClose }: GifModalProps) {
  const { selectedTaskId, tasks } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [mode, setMode] = useState<GifMode>('extract');
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [frameDelay, setFrameDelay] = useState(300);
  const [loop, setLoop] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [composeImageDatas, setComposeImageDatas] = useState<ImageData[]>([]);

  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setFrames([]);
    setError('');
    setPreviewUrl('');
    setPreviewing(false);
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, [isOpen, selectedTaskId, mode]);

  const handleExtract = useCallback(async () => {
    if (!selectedTask) return;
    setLoading(true);
    setError('');
    setFrames([]);

    try {
      if (!selectedTask.file.type.includes('gif') && !selectedTask.fileName.toLowerCase().endsWith('.gif')) {
        setError('请选择 GIF 文件');
        setLoading(false);
        return;
      }

      const omggif = (await import('omggif')).default;
      const buf = await selectedTask.file.arrayBuffer();
      const reader = new omggif.GifReader(new Uint8Array(buf));
      const numFrames = reader.numFrames();
      const extractedFrames: GifFrame[] = [];

      for (let i = 0; i < numFrames; i++) {
        const info = reader.frameInfo(i);
        const imageData = new Uint8ClampedArray(reader.width * reader.height * 4);
        reader.decodeAndBlitFrameRGBA(i, imageData);
        const canvas = document.createElement('canvas');
        canvas.width = reader.width;
        canvas.height = reader.height;
        const ctx = canvas.getContext('2d')!;
        const id = ctx.createImageData(reader.width, reader.height);
        id.data.set(imageData);
        ctx.putImageData(id, 0, 0);
        extractedFrames.push({ canvas, delay: (info as { delay?: number }).delay ?? 100 });
      }

      setFrames(extractedFrames);
    } catch {
      setError('提取帧失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTask]);

  const handleDownloadAllFrames = useCallback(async () => {
    if (frames.length === 0) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let i = 0; i < frames.length; i++) {
      const blob: Blob = await new Promise((resolve) => {
        frames[i].canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      zip.file(`frame_${String(i).padStart(3, '0')}.png`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.download = `${selectedTask?.fileName.replace(/\.[^.]+$/, '') || 'gif'}_frames.zip`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, [frames, selectedTask]);

  const handleLoadAllTasksAsFrames = useCallback(async () => {
    if (tasks.length === 0) {
      setError('没有可用的图片');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const imageDatas: ImageData[] = [];
      for (const task of tasks) {
        const img = await fileToImage(task.file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        imageDatas.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
      setComposeImageDatas(imageDatas);
    } catch {
      setError('加载帧失败');
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  const handlePreviewCompose = useCallback(async () => {
    if (composeImageDatas.length === 0) return;

    if (previewing) {
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      setPreviewing(false);
      setPreviewUrl('');
      return;
    }

    try {
      const gifenc = await import('gifenc');
      const gif = gifenc.GIFEncoder();

      for (const frame of composeImageDatas) {
        const palette = gifenc.quantize(frame, 256);
        const indexed = gifenc.applyPalette(frame, palette);
        gif.writeFrame(indexed, frame.width, frame.height, { palette, delay: frameDelay });
      }
      gif.finish();

      const blob = new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setPreviewing(true);
    } catch {
      setError('生成预览失败');
    }
  }, [composeImageDatas, frameDelay, previewing, previewUrl]);

  const handleDownloadGif = useCallback(async () => {
    if (composeImageDatas.length === 0) return;

    try {
      const gifenc = await import('gifenc');
      const gif = gifenc.GIFEncoder();

      for (const frame of composeImageDatas) {
        const palette = gifenc.quantize(frame, 256);
        const indexed = gifenc.applyPalette(frame, palette);
        gif.writeFrame(indexed, frame.width, frame.height, { palette, delay: frameDelay });
      }
      gif.finish();

      const bytes = gif.bytes();
      const blob = new Blob([bytes as BlobPart], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `composed_${Date.now()}.gif`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('生成 GIF 失败');
    }
  }, [composeImageDatas, frameDelay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-2xl glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">GIF 工具</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">提取 GIF 帧或合成 GIF</p>

        <div className="mt-6 space-y-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {([
              { key: 'extract' as const, label: '提取帧', icon: Film },
              { key: 'compose' as const, label: '合成GIF', icon: Image },
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

          {error && (
            <div className="text-center py-3 text-amber-500 text-sm bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              {error}
            </div>
          )}

          {mode === 'extract' && (
            <div className="space-y-4">
              {!selectedTask ? (
                <div className="text-center py-12 text-slate-400">请先选择一张 GIF 图片</div>
              ) : (
                <>
                  <button
                    onClick={handleExtract}
                    disabled={loading}
                    className="w-full btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '提取中...' : `提取帧 (${selectedTask.fileName})`}
                  </button>

                  {frames.length > 0 && (
                    <>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        共 {frames.length} 帧
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                        {frames.map((frame, i) => {
                          const dataUrl = frame.canvas.toDataURL('image/png');
                          return (
                            <div key={i} className="relative rounded-lg overflow-hidden">
                              <img src={dataUrl} alt={`帧 ${i + 1}`} className="w-full object-cover" />
                              <span className="absolute bottom-0 left-0 right-0 text-center bg-black/50 text-white text-[10px] py-0.5">
                                {i + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={handleDownloadAllFrames}
                        className="w-full flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
                      >
                        <Download className="w-4 h-4" />
                        下载所有帧 (ZIP)
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {mode === 'compose' && (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">请先上传图片作为帧</div>
              ) : (
                <>
                  <button
                    onClick={handleLoadAllTasksAsFrames}
                    disabled={loading}
                    className="w-full btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '加载中...' : `加载全部 ${tasks.length} 张图片为帧`}
                  </button>

                  {composeImageDatas.length > 0 && (
                    <>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                        {tasks.map((task, i) => (
                          <div key={task.id} className="relative rounded-lg overflow-hidden">
                            {task.thumbnail ? (
                              <img src={task.thumbnail} alt={task.fileName} className="w-full h-16 object-cover" />
                            ) : (
                              <div className="w-full h-16 bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs text-slate-500">—</div>
                            )}
                            <span className="absolute bottom-0 left-0 right-0 text-center bg-black/50 text-white text-[10px] py-0.5">
                              {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          帧间隔: {frameDelay}ms
                        </label>
                        <input
                          type="range"
                          min={50}
                          max={2000}
                          step={10}
                          value={frameDelay}
                          onChange={(e) => setFrameDelay(parseInt(e.target.value))}
                          className="w-full accent-brand-500 mt-1"
                        />
                      </div>

                      <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={loop}
                          onChange={(e) => setLoop(e.target.checked)}
                          className="rounded accent-brand-500"
                        />
                        循环播放
                      </label>

                      {previewUrl ? (
                        <div className="flex justify-center bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                          <img
                            src={previewUrl}
                            alt="GIF 预览"
                            className="max-h-48 rounded-lg object-contain"
                          />
                        </div>
                      ) : null}

                      <div className="flex gap-3">
                        <button
                          onClick={handlePreviewCompose}
                          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-2.5"
                        >
                          {previewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {previewing ? '停止预览' : '预览'}
                        </button>
                        <button
                          onClick={handleDownloadGif}
                          className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
                        >
                          <Download className="w-4 h-4" />
                          下载GIF
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
