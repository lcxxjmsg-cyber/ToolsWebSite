import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { WatermarkSettings } from '../types/index';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  applyToAll?: boolean;
}

type WatermarkPosition = WatermarkSettings['position'];

const POSITIONS: { key: WatermarkPosition; label: string }[] = [
  { key: 'topLeft', label: '左上' },
  { key: 'topRight', label: '右上' },
  { key: 'center', label: '居中' },
  { key: 'bottomLeft', label: '左下' },
  { key: 'bottomRight', label: '右下' },
];

function getPositionStyle(pos: WatermarkPosition): React.CSSProperties {
  const margin = 8;
  switch (pos) {
    case 'topLeft': return { top: margin, left: margin };
    case 'topRight': return { top: margin, right: margin };
    case 'bottomLeft': return { bottom: margin, left: margin };
    case 'bottomRight': return { bottom: margin, right: margin };
    case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
}

export default function WatermarkModal({ isOpen, onClose, applyToAll = false }: WatermarkModalProps) {
  const { selectedTaskId, tasks, updateTaskSettings, updateAllTasksSettings } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [type, setType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState<WatermarkPosition>('bottomRight');
  const [imageUrl, setImageUrl] = useState('');
  const [imageScale, setImageScale] = useState(50);
  const [imageFileName, setImageFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const wm = selectedTask.settings.watermark;
    if (wm) {
      setType(wm.type);
      setText(wm.text);
      setFontSize(wm.fontSize);
      setFontColor(wm.fontColor);
      setOpacity(wm.opacity);
      setPosition(wm.position);
      setImageUrl(wm.imageUrl);
      setImageScale(wm.imageScale);
    }
  }, [isOpen, selectedTask]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedTaskId) return;
    const settings: WatermarkSettings = {
      type,
      text,
      fontSize,
      fontColor,
      opacity,
      position,
      imageUrl,
      imageScale,
    };
    updateTaskSettings(selectedTaskId, { watermark: settings });
    if (applyToAll) {
      updateAllTasksSettings({ watermark: settings });
    }
    onClose();
  }, [selectedTaskId, type, text, fontSize, fontColor, opacity, position, imageUrl, imageScale, applyToAll, updateTaskSettings, updateAllTasksSettings, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-lg glass rounded-2xl shadow-2xl animate-scale-in p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">添加水印</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">选择水印类型并调整参数</p>

        {selectedTask?.thumbnail && (
          <div className="mt-4 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl p-3 relative overflow-hidden" style={{ minHeight: 160 }}>
            <img
              src={selectedTask.thumbnail}
              alt="预览底图"
              className="max-h-40 rounded object-contain"
            />
            {type === 'text' && text && (
              <div
                className="absolute pointer-events-none"
                style={{
                  ...getPositionStyle(position),
                  fontSize: `${Math.max(8, fontSize * 0.4)}px`,
                  color: fontColor,
                  opacity: opacity / 100,
                  fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {text}
              </div>
            )}
            {type === 'image' && imageUrl && (
              <div
                className="absolute pointer-events-none"
                style={{
                  ...getPositionStyle(position),
                  opacity: opacity / 100,
                }}
              >
                <img
                  src={imageUrl}
                  alt="水印预览"
                  style={{ maxWidth: `${imageScale * 0.6}px`, maxHeight: `${imageScale * 0.6}px` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {([
              { key: 'text' as const, label: '文字水印' },
              { key: 'image' as const, label: '图片水印' },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setType(opt.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  type === opt.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {type === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">文字内容</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入水印文字..."
                  className="input-field text-sm py-2 mt-1"
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    字体大小: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={120}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-brand-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">字体颜色</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0"
                    />
                    <span className="text-xs text-slate-500 font-mono">{fontColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'image' && (
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 transition-colors group"
                >
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-brand-500 transition-colors">
                    {imageFileName || '点击上传水印图片'}
                  </span>
                </button>
              </div>

              {imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    alt="水印预览"
                    className="max-h-24 rounded-lg object-contain bg-slate-200 dark:bg-slate-700 p-2"
                    style={{ opacity: opacity / 100 }}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  缩放: {imageScale}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={imageScale}
                  onChange={(e) => setImageScale(parseInt(e.target.value))}
                  className="w-full accent-brand-500 mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              不透明度: {opacity}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-full accent-brand-500 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              水印位置
            </label>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((pos) => {
                const isActive = position === pos.key;
                return (
                  <button
                    key={pos.key}
                    onClick={() => setPosition(pos.key)}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
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
