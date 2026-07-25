export type ImageFormat = 'png' | 'jpeg' | 'jpg' | 'webp' | 'gif' | 'bmp' | 'ico' | 'tiff' | 'avif' | 'heic' | 'heif' | 'svg' | 'pdf';

export const SUPPORTED_INPUT_FORMATS: ImageFormat[] = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp', 'ico', 'tiff', 'avif', 'heic', 'heif', 'svg', 'pdf'];

export const SUPPORTED_OUTPUT_FORMATS: ImageFormat[] = ['png', 'jpg', 'webp', 'gif', 'bmp', 'ico', 'tiff', 'avif'];

export const FORMAT_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
};

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface ResizeSettings {
  mode: 'percent' | 'pixels' | 'fit';
  percent?: number;
  width?: number;
  height?: number;
  lockAspectRatio: boolean;
  fitWidth?: number;
  fitHeight?: number;
  fitMode?: 'cover' | 'contain';
}

export interface CompressSettings {
  mode: 'quality' | 'lossless' | 'targetSize';
  quality: number;
  targetSizeKB?: number;
}

export interface FilterSettings {
  grayscale: number;
  sepia: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  invert: number;
  opacity: number;
}

export interface WatermarkSettings {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
  imageUrl: string;
  imageScale: number;
}

export interface BorderSettings {
  width: number;
  color: string;
  radius: number;
}

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'error';

export type ToolMode = 'convert' | 'compress' | 'crop' | 'resize' | 'filter' | 'watermark' | 'border' | 'metadata';

export interface TaskSettings {
  outputFormat: ImageFormat;
  compress: CompressSettings;
  crop: CropSettings | null;
  resize: ResizeSettings | null;
  filter: FilterSettings;
  watermark: WatermarkSettings | null;
  border: BorderSettings | null;
  activeTool: ToolMode;
}

export const DEFAULT_COMPRESS_SETTINGS: CompressSettings = {
  mode: 'quality',
  quality: 80,
};

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  grayscale: 0,
  sepia: 0,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
};

export const DEFAULT_TASK_SETTINGS: TaskSettings = {
  outputFormat: 'png',
  compress: DEFAULT_COMPRESS_SETTINGS,
  crop: null,
  resize: null,
  filter: DEFAULT_FILTER_SETTINGS,
  watermark: null,
  border: null,
  activeTool: 'convert',
};

export interface TaskItem {
  id: string;
  file: File;
  fileName: string;
  originalSize: number;
  originalFormat: string;
  thumbnail: string;
  status: TaskStatus;
  progress: number;
  errorMessage?: string;
  resultBlob?: Blob;
  resultSize?: number;
  resultUrl?: string;
  settings: TaskSettings;
}

export interface BatchSettings extends TaskSettings {
  applyToAll: boolean;
}
