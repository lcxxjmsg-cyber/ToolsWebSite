import {
  FORMAT_MIME_MAP,
  SUPPORTED_INPUT_FORMATS,
} from '../types/index';

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex + 1).toLowerCase();
}

export function getMimeType(format: string): string {
  return FORMAT_MIME_MAP[format.toLowerCase()] || `image/${format.toLowerCase()}`;
}

export function getFormatFromExtension(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === 'jpg' || lower === 'jpeg') return 'jpeg';
  if (lower in FORMAT_MIME_MAP) return lower;
  return lower;
}

export function formatSize(bytes: number): string {
  if (bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / base ** i;

  if (i === 0) return `${bytes} B`;

  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

export function isValidImageFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (!ext) return false;

  if (file.type && file.type.startsWith('image/')) return true;

  return isInputFormatSupported(ext);
}

export function getFormatLabel(format: string): string {
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
    heic: 'HEIC',
    heif: 'HEIF',
    svg: 'SVG',
    pdf: 'PDF',
  };
  return labels[format.toLowerCase()] || format.toUpperCase();
}

export function isInputFormatSupported(ext: string): boolean {
  const normalized = ext.toLowerCase();
  return SUPPORTED_INPUT_FORMATS.some(
    (fmt) => fmt === normalized || (fmt === 'jpg' && normalized === 'jpeg') || (fmt === 'jpeg' && normalized === 'jpg'),
  );
}
