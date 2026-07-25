import { useState, useEffect, useCallback } from 'react';
import { X, Download, ScanEye, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { fileToImage } from '../utils/imageProcessor';

interface ExifModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXIF_LABEL_MAP: Record<string, string> = {
  Make: '相机品牌',
  Model: '相机型号',
  DateTimeOriginal: '拍摄时间',
  ImageWidth: '尺寸-宽',
  ImageHeight: '尺寸-高',
  ISOSpeedRatings: 'ISO',
  FNumber: '光圈',
  ExposureTime: '快门速度',
  FocalLength: '焦距',
  Flash: '闪光灯',
  GPSLatitude: 'GPS纬度',
  GPSLongitude: 'GPS经度',
  GPSAltitude: 'GPS海拔',
  GPSLatitudeRef: 'GPS纬度参考',
  GPSLongitudeRef: 'GPS经度参考',
  Orientation: '方向',
  Software: '软件',
  Copyright: '版权',
  Artist: '作者',
  ExposureBias: '曝光补偿',
  MeteringMode: '测光模式',
  WhiteBalance: '白平衡',
  ColorSpace: '色彩空间',
  ExifImageWidth: 'EXIF宽度',
  ExifImageHeight: 'EXIF高度',
  XResolution: '水平分辨率',
  YResolution: '垂直分辨率',
  ResolutionUnit: '分辨率单位',
};

function formatExifValue(key: string, value: unknown): string {
  if (value == null) return '—';
  if (key === 'GPSLatitude' || key === 'GPSLongitude') {
    if (Array.isArray(value) && value.length === 3) {
      const deg = (value[0] as number) || 0;
      const min = (value[1] as number) || 0;
      const sec = (value[2] as number) || 0;
      return `${deg}°${min}'${sec.toFixed(1)}"`;
    }
    return String(value);
  }
  if (key === 'FNumber') {
    return `f/${(value as number).toFixed(1)}`;
  }
  if (key === 'ExposureTime') {
    const num = value as number;
    if (num < 1) {
      return `1/${Math.round(1 / num)}s`;
    }
    return `${num}s`;
  }
  if (key === 'FocalLength') {
    const num = value as number;
    return `${num.toFixed(1)}mm`;
  }
  if (key === 'Flash') {
    const v = value as number;
    if (v === 0) return '关闭';
    if (v === 1) return '开启';
    return String(v);
  }
  return String(value);
}

export default function ExifModal({ isOpen, onClose }: ExifModalProps) {
  const { selectedTaskId, tasks } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cleanImageUrl, setCleanImageUrl] = useState('');

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
    setExifData(null);
    setError('');
    setCleanImageUrl('');
  }, [isOpen, selectedTaskId]);

  const handleReadExif = useCallback(async () => {
    if (!selectedTask) return;
    setLoading(true);
    setError('');
    setExifData(null);

    try {
      const EXIF = (await import('exif-js')).default;
      const buf = await selectedTask.file.arrayBuffer();
      const tags = EXIF.readFromBinaryFile(buf as unknown as ArrayBuffer) as Record<string, unknown>;

      if (!tags || Object.keys(tags).filter((k) => k !== 'thumbnail').length === 0) {
        setError('未见 EXIF 数据');
        setExifData(null);
      } else {
        setExifData(tags);
      }
    } catch {
      setError('读取 EXIF 数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTask]);

  const handleRemoveExif = useCallback(async () => {
    if (!selectedTask) return;
    try {
      const img = await fileToImage(selectedTask.file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const cleanBlob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      });

      const url = URL.createObjectURL(cleanBlob);
      setCleanImageUrl(url);

      const a = document.createElement('a');
      const baseName = selectedTask.fileName.replace(/\.[^.]+$/, '');
      a.download = `${baseName}_clean.png`;
      a.href = url;
      a.click();
    } catch {
      setError('清除元数据失败');
    }
  }, [selectedTask]);

  const displayEntries = exifData
    ? Object.entries(exifData)
        .filter(([k]) => k !== 'thumbnail')
        .filter(([, v]) => v != null)
    : [];

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

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">EXIF 元数据</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">查看或清除图片的 EXIF 信息</p>

        {!selectedTask ? (
          <div className="mt-6 text-center py-12 text-slate-400">
            请先选择一张图片
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {selectedTask.thumbnail && (
              <div className="flex justify-center">
                <img
                  src={selectedTask.thumbnail}
                  alt={selectedTask.fileName}
                  className="max-h-32 rounded-lg object-contain bg-slate-100 dark:bg-slate-800 p-2"
                />
              </div>
            )}

            <button
              onClick={handleReadExif}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ScanEye className="w-4 h-4" />
              {loading ? '读取中...' : '读取元数据'}
            </button>

            {error && (
              <div className="text-center py-4 text-amber-500 text-sm">
                {error}
              </div>
            )}

            {exifData && displayEntries.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {displayEntries.map(([key, value]) => {
                      const label = EXIF_LABEL_MAP[key] || key;
                      const displayValue = formatExifValue(key, value);
                      return (
                        <tr
                          key={key}
                          className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                        >
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                            {label}
                          </td>
                          <td className="py-2 px-3 text-slate-900 dark:text-slate-100 break-all">
                            {displayValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRemoveExif}
                className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-2.5"
              >
                <Trash2 className="w-4 h-4" />
                清除元数据
              </button>
              {cleanImageUrl && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    const baseName = selectedTask.fileName.replace(/\.[^.]+$/, '');
                    a.download = `${baseName}_clean.png`;
                    a.href = cleanImageUrl;
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
