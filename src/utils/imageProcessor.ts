import type {
  CompressSettings,
  CropSettings,
  FilterSettings,
  ResizeSettings,
  WatermarkSettings,
  BorderSettings,
  TaskSettings,
} from '../types/index';
import { FORMAT_MIME_MAP, DEFAULT_TASK_SETTINGS } from '../types/index';
import { getFileExtension } from './formatUtils';
import { jsPDF } from 'jspdf';

// WASM encoders for proper compression (loaded on demand)
let jsquashPng: typeof import('@jsquash/png') | null = null;
let jsquashJpeg: typeof import('@jsquash/jpeg') | null = null;
let jsquashOxipng: typeof import('@jsquash/oxipng') | null = null;
let jsquashWebp: typeof import('@jsquash/webp') | null = null;
let jsquashAvif: typeof import('@jsquash/avif') | null = null;

async function loadPngEncoder() { if (!jsquashPng) jsquashPng = await import('@jsquash/png'); return jsquashPng; }
async function loadJpegEncoder() { if (!jsquashJpeg) jsquashJpeg = await import('@jsquash/jpeg'); return jsquashJpeg; }
async function loadOxipng() { if (!jsquashOxipng) jsquashOxipng = await import('@jsquash/oxipng'); return jsquashOxipng; }
async function loadWebpEncoder() { if (!jsquashWebp) jsquashWebp = await import('@jsquash/webp'); return jsquashWebp; }
async function loadAvifEncoder() { if (!jsquashAvif) jsquashAvif = await import('@jsquash/avif'); return jsquashAvif; }

let heic2any: ((args: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>) | null = null;

async function loadHeicDecoder() {
  if (heic2any) return heic2any;
  const mod = await import('heic2any');
  heic2any = mod.default;
  return heic2any;
}

export async function decodeHeic(file: File): Promise<Blob> {
  const decoder = await loadHeicDecoder();
  const result = await decoder({ blob: file, toType: 'image/png' });
  return Array.isArray(result) ? result[0] : result;
}

export function isHeicFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';
}

function getMimeType(format: string): string {
  return FORMAT_MIME_MAP[format] || `image/${format}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number,
): Promise<Blob> {
  const mimeType = getMimeType(format);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      mimeType,
      quality / 100,
    );
  });
}

async function imageElementToCanvas(
  img: HTMLImageElement,
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}

async function fileOrBlobToImage(input: File | Blob): Promise<HTMLImageElement> {
  if (input instanceof File) {
    return fileToImage(input);
  }
  return blobToImage(input);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob'));
    };
    img.src = url;
  });
}

export function imageToBlob(
  img: HTMLImageElement,
  format: string,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  ctx.drawImage(img, 0, 0);
  return canvasToBlob(canvas, format, quality);
}

export async function compressImage(
  file: File,
  settings: CompressSettings,
): Promise<Blob> {
  const img = await fileToImage(file);
  const { canvas } = await imageElementToCanvas(img);

  if (settings.mode === 'lossless') {
    return canvasToBlob(canvas, 'png', 100);
  }

  if (settings.mode === 'quality') {
    return canvasToBlob(canvas, 'png', settings.quality);
  }

  // targetSize mode — binary search quality
  const targetBytes = (settings.targetSizeKB ?? 100) * 1024;
  let lo = 10;
  let hi = 100;
  let bestBlob: Blob | null = null;

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) >> 1;
    const blob = await canvasToBlob(canvas, 'jpeg', mid);

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (Math.abs(blob.size - targetBytes) / targetBytes <= 0.05) {
      return blob;
    }

    if (blob.size > targetBytes) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }

    if (lo > hi) break;
  }

  if (!bestBlob) {
    throw new Error('Failed to compress image to target size');
  }

  return bestBlob;
}

export async function resizeImage(
  file: File | Blob,
  settings: ResizeSettings,
): Promise<Blob> {
  const img = await fileOrBlobToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let targetW = iw;
  let targetH = ih;

  if (settings.mode === 'percent' && settings.percent != null) {
    const ratio = settings.percent / 100;
    targetW = Math.round(iw * ratio);
    targetH = Math.round(ih * ratio);
  } else if (settings.mode === 'pixels') {
    if (settings.width != null) {
      targetW = Math.round(settings.width);
      if (settings.lockAspectRatio) {
        targetH = Math.round((settings.width / iw) * ih);
      }
    }
    if (settings.height != null) {
      targetH = Math.round(settings.height);
      if (settings.lockAspectRatio && settings.width == null) {
        targetW = Math.round((settings.height / ih) * iw);
      } else if (!settings.lockAspectRatio) {
        // width already set or not; keep both
      }
    }
    if (settings.width == null && settings.height == null) {
      targetW = iw;
      targetH = ih;
    }
  } else if (settings.mode === 'fit') {
    const fw = settings.fitWidth ?? iw;
    const fh = settings.fitHeight ?? ih;
    const mode = settings.fitMode ?? 'contain';

    if (mode === 'contain') {
      const scale = Math.min(fw / iw, fh / ih);
      targetW = Math.round(iw * scale);
      targetH = Math.round(ih * scale);
    } else {
      const scale = Math.max(fw / iw, fh / ih);
      targetW = Math.round(iw * scale);
      targetH = Math.round(ih * scale);
    }
  }

  targetW = Math.max(1, targetW);
  targetH = Math.max(1, targetH);

  canvas.width = targetW;
  canvas.height = targetH;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return canvasToBlob(canvas, 'png', 100);
}

export async function cropImage(
  file: File | Blob,
  settings: CropSettings,
): Promise<Blob> {
  const img = await fileOrBlobToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  const sx = Math.max(0, Math.round(settings.x));
  const sy = Math.max(0, Math.round(settings.y));
  const sw = Math.min(img.naturalWidth - sx, Math.round(settings.width));
  const sh = Math.min(img.naturalHeight - sy, Math.round(settings.height));

  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  return canvasToBlob(canvas, 'png', 100);
}

export async function applyFilters(
  file: File | Blob,
  settings: FilterSettings,
): Promise<Blob> {
  const img = await fileOrBlobToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  const parts: string[] = [];

  if (settings.blur > 0) parts.push(`blur(${settings.blur}px)`);
  if (settings.brightness !== 100) parts.push(`brightness(${settings.brightness}%)`);
  if (settings.contrast !== 100) parts.push(`contrast(${settings.contrast}%)`);
  if (settings.grayscale > 0) parts.push(`grayscale(${settings.grayscale}%)`);
  if (settings.hueRotate !== 0) parts.push(`hue-rotate(${settings.hueRotate}deg)`);
  if (settings.invert > 0) parts.push(`invert(${settings.invert}%)`);
  if (settings.opacity < 100) parts.push(`opacity(${settings.opacity}%)`);
  if (settings.saturation !== 100) parts.push(`saturate(${settings.saturation}%)`);
  if (settings.sepia > 0) parts.push(`sepia(${settings.sepia}%)`);

  if (parts.length > 0) {
    ctx.filter = parts.join(' ');
  }

  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, 'png', 100);
}

export async function convertFormat(
  file: File | Blob,
  targetFormat: string,
  quality: number,
): Promise<Blob> {
  const img = await fileOrBlobToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  ctx.drawImage(img, 0, 0);

  return canvasToBlob(canvas, targetFormat, quality);
}

export async function applyWatermark(
  file: File | Blob,
  settings: WatermarkSettings,
): Promise<Blob> {
  const img = await fileOrBlobToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  ctx.drawImage(img, 0, 0);
  ctx.globalAlpha = settings.opacity / 100;

  if (settings.type === 'text') {
    const fontSize = Math.max(12, Math.round(settings.fontSize));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = settings.fontColor;

    const metrics = ctx.measureText(settings.text);
    const textWidth = metrics.width;
    const textHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || fontSize;

    const { x, y } = getWatermarkPosition(
      canvas.width,
      canvas.height,
      textWidth,
      textHeight,
      settings.position,
    );

    ctx.fillText(settings.text, x, y + textHeight * 0.8);
  } else if (settings.type === 'image' && settings.imageUrl) {
    const wmImg = new Image();
    wmImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      wmImg.onload = () => resolve();
      wmImg.onerror = () => reject(new Error('Failed to load watermark image'));
      wmImg.src = settings.imageUrl;
    });

    const scale = settings.imageScale / 100;
    const wmW = Math.round(wmImg.naturalWidth * scale);
    const wmH = Math.round(wmImg.naturalHeight * scale);

    const { x, y } = getWatermarkPosition(
      canvas.width,
      canvas.height,
      wmW,
      wmH,
      settings.position,
    );

    ctx.drawImage(wmImg, x, y, wmW, wmH);
  }

  return canvasToBlob(canvas, 'png', 100);
}

function getWatermarkPosition(
  canvasW: number,
  canvasH: number,
  wmW: number,
  wmH: number,
  position: WatermarkSettings['position'],
): { x: number; y: number } {
  const padding = 20;

  switch (position) {
    case 'topLeft':
      return { x: padding, y: padding };
    case 'topRight':
      return { x: canvasW - wmW - padding, y: padding };
    case 'bottomLeft':
      return { x: padding, y: canvasH - wmH - padding };
    case 'bottomRight':
      return { x: canvasW - wmW - padding, y: canvasH - wmH - padding };
    case 'center':
      return {
        x: Math.round((canvasW - wmW) / 2),
        y: Math.round((canvasH - wmH) / 2),
      };
    default:
      return { x: padding, y: canvasH - wmH - padding };
  }
}

export async function applyBorder(
  file: File | Blob,
  settings: BorderSettings,
): Promise<Blob> {
  const img = await fileOrBlobToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  ctx.drawImage(img, 0, 0);

  if (settings.width <= 0) {
    return canvasToBlob(canvas, 'png', 100);
  }

  const w = canvas.width;
  const h = canvas.height;
  const half = settings.width / 2;
  const r = Math.min(settings.radius, w / 2 - half, h / 2 - half);

  ctx.strokeStyle = settings.color;
  ctx.lineWidth = settings.width;

  if (r > 0) {
    ctx.beginPath();
    const x0 = half;
    const y0 = half;
    const x1 = w - half;
    const y1 = h - half;

    ctx.moveTo(x0 + r, y0);
    ctx.lineTo(x1 - r, y0);
    ctx.arcTo(x1, y0, x1, y0 + r, r);
    ctx.lineTo(x1, y1 - r);
    ctx.arcTo(x1, y1, x1 - r, y1, r);
    ctx.lineTo(x0 + r, y1);
    ctx.arcTo(x0, y1, x0, y1 - r, r);
    ctx.lineTo(x0, y0 + r);
    ctx.arcTo(x0, y0, x0 + r, y0, r);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.strokeRect(half, half, w - settings.width, h - settings.width);
  }

  return canvasToBlob(canvas, 'png', 100);
}

function hasActiveFilters(settings: FilterSettings): boolean {
  return (
    settings.blur > 0 ||
    settings.brightness !== 100 ||
    settings.contrast !== 100 ||
    settings.grayscale > 0 ||
    settings.hueRotate !== 0 ||
    settings.invert > 0 ||
    settings.opacity < 100 ||
    settings.saturation !== 100 ||
    settings.sepia > 0
  );
}

function quantizeColors(imageData: ImageData, maxColors: number): ImageData {
  const pixels = imageData.data;
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], count: 1 });
    }
  }

  const colors = Array.from(colorMap.values());

  if (colors.length <= maxColors) return imageData;

  function channelRange(ch: 'r' | 'g' | 'b', cols: typeof colors): number {
    let min = Infinity, max = -Infinity;
    for (const c of cols) { if (c[ch] < min) min = c[ch]; if (c[ch] > max) max = c[ch]; }
    return max - min;
  }

  function medianCut(cols: typeof colors, depth: number, targetColors: number): typeof colors {
    if (cols.length <= targetColors || depth <= 0) {
      let tr = 0, tg = 0, tb = 0, tc = 0;
      for (const c of cols) { tr += c.r * c.count; tg += c.g * c.count; tb += c.b * c.count; tc += c.count; }
      return [{ r: tc > 0 ? Math.round(tr / tc) : 128, g: tc > 0 ? Math.round(tg / tc) : 128, b: tc > 0 ? Math.round(tb / tc) : 128, count: 1 }];
    }

    const rRange = channelRange('r', cols);
    const gRange = channelRange('g', cols);
    const bRange = channelRange('b', cols);
    const channel: 'r' | 'g' | 'b' = rRange >= gRange && rRange >= bRange ? 'r' : gRange >= bRange ? 'g' : 'b';

    cols.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(cols.length / 2);
    const halfTarget = Math.max(1, Math.floor(targetColors / 2));

    return [
      ...medianCut(cols.slice(0, mid), depth - 1, halfTarget),
      ...medianCut(cols.slice(mid), depth - 1, targetColors - halfTarget),
    ];
  }

  const palette = medianCut(colors, 6, maxColors);

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    let minDist = Infinity;
    let best = palette[0];
    for (const c of palette) {
      const dr = pixels[i] - c.r;
      const dg = pixels[i + 1] - c.g;
      const db = pixels[i + 2] - c.b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) {
        minDist = dist;
        best = c;
      }
    }
    pixels[i] = best.r;
    pixels[i + 1] = best.g;
    pixels[i + 2] = best.b;
  }

  return imageData;
}

export async function smartCompressPNG(file: File | Blob, colors: number): Promise<Blob> {
  const img = file instanceof File ? await fileToImage(file) : await blobToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const quantized = quantizeColors(imageData, colors);
  ctx.putImageData(quantized, 0, 0);

  return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

async function encodeWithWasm(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (format === 'png') {
    const png = await loadPngEncoder();
    const compressed = await png.encode(imageData);
    return new Blob([new Uint8Array(compressed)], { type: 'image/png' });
  } else if (format === 'jpg' || format === 'jpeg') {
    const jpeg = await loadJpegEncoder();
    const compressed = await jpeg.encode(imageData, quality);
    return new Blob([new Uint8Array(compressed)], { type: 'image/jpeg' });
  } else if (format === 'webp') {
    const webp = await loadWebpEncoder();
    const compressed = await webp.encode(imageData, Math.round(quality));
    return new Blob([new Uint8Array(compressed)], { type: 'image/webp' });
  } else if (format === 'avif') {
    const avif = await loadAvifEncoder();
    const compressed = await avif.encode(imageData, { quality: Math.round(quality) });
    return new Blob([new Uint8Array(compressed)], { type: 'image/avif' });
  } else {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), getMimeType(format), quality / 100));
  }
}

export async function losslessOptimizePng(file: File): Promise<Blob> {
  try {
    const oxipng = await loadOxipng();
    const buffer = await file.arrayBuffer();
    const optimized = await oxipng.optimise(new Uint8Array(buffer), { level: 6 });
    if (optimized && optimized.length < buffer.byteLength) {
      console.log(`[oxipng] ${file.name}: ${buffer.byteLength} -> ${optimized.length} (${Math.round((1 - optimized.length / buffer.byteLength) * 100)}% smaller)`);
      return new Blob([new Uint8Array(optimized)], { type: 'image/png' });
    }
    console.log(`[oxipng] ${file.name}: no improvement (${buffer.byteLength} bytes)`);
  } catch (e) {
    console.error('[oxipng] failed:', e);
  }
  return file;
}

export async function processImage(
  file: File,
  settings: TaskSettings,
): Promise<{ blob: Blob; format: string }> {
  const inputExt = getFileExtension(file.name);
  let inputFormat = inputExt === 'jpg' || inputExt === 'jpeg' ? 'jpg' : inputExt;
  if (inputFormat === 'jpeg') inputFormat = 'jpg';
  const outputFormat = settings.outputFormat === 'jpeg' ? 'jpg' : settings.outputFormat;

  const noCompressChange = settings.compress.mode === DEFAULT_TASK_SETTINGS.compress.mode
    && settings.compress.quality === DEFAULT_TASK_SETTINGS.compress.quality;

  const isLosslessNoChange = settings.compress.mode === 'lossless'
    && !settings.crop && !settings.resize && !hasActiveFilters(settings.filter)
    && !settings.watermark && (!settings.border || settings.border.width <= 0)
    && outputFormat === inputFormat && settings.outputFormat !== 'pdf';

  if (isLosslessNoChange) {
    if (outputFormat === 'png') {
      const optimized = await losslessOptimizePng(file);
      return { blob: optimized, format: getMimeType(inputFormat) };
    }
    return { blob: file, format: getMimeType(inputFormat) };
  }

  const isNoOp =
    !settings.crop &&
    !settings.resize &&
    !hasActiveFilters(settings.filter) &&
    !settings.watermark &&
    (!settings.border || settings.border.width <= 0) &&
    outputFormat === inputFormat &&
    noCompressChange &&
    settings.outputFormat !== 'pdf';

  if (isNoOp) {
    return { blob: file, format: getMimeType(inputFormat) };
  }

  let img: HTMLImageElement;
  if (isHeicFile(file)) {
    const pngBlob = await decodeHeic(file);
    img = await blobToImage(pngBlob);
  } else {
    img = await fileToImage(file);
  }

  let canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  let ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  ctx.drawImage(img, 0, 0);

  // Step 1: Crop (removes portions of the image)
  if (settings.crop) {
    const { x, y, width, height } = settings.crop;
    const sx = Math.max(0, Math.round(x));
    const sy = Math.max(0, Math.round(y));
    const sw = Math.min(canvas.width - sx, Math.round(width));
    const sh = Math.min(canvas.height - sy, Math.round(height));

    const cropped = document.createElement('canvas');
    cropped.width = sw;
    cropped.height = sh;
    const croppedCtx = cropped.getContext('2d');
    if (!croppedCtx) throw new Error('Failed to get 2D context');
    croppedCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas = cropped;
    ctx = croppedCtx;
  }

  // Step 2: Resize
  if (settings.resize) {
    const resize = settings.resize;
    const iw = canvas.width;
    const ih = canvas.height;
    let targetW = iw;
    let targetH = ih;

    if (resize.mode === 'percent' && resize.percent != null) {
      const ratio = resize.percent / 100;
      targetW = Math.round(iw * ratio);
      targetH = Math.round(ih * ratio);
    } else if (resize.mode === 'pixels') {
      if (resize.width != null) {
        targetW = Math.round(resize.width);
        if (resize.lockAspectRatio) {
          targetH = Math.round((resize.width / iw) * ih);
        }
      }
      if (resize.height != null) {
        targetH = Math.round(resize.height);
        if (resize.lockAspectRatio && resize.width == null) {
          targetW = Math.round((resize.height / ih) * iw);
        }
      }
    } else if (resize.mode === 'fit') {
      const fw = resize.fitWidth ?? iw;
      const fh = resize.fitHeight ?? ih;
      const mode = resize.fitMode ?? 'contain';
      const scale = mode === 'contain' ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
      targetW = Math.round(iw * scale);
      targetH = Math.round(ih * scale);
    }

    targetW = Math.max(1, targetW);
    targetH = Math.max(1, targetH);

    const resized = document.createElement('canvas');
    resized.width = targetW;
    resized.height = targetH;
    const resizedCtx = resized.getContext('2d');
    if (!resizedCtx) throw new Error('Failed to get 2D context');
    resizedCtx.drawImage(canvas, 0, 0, targetW, targetH);
    canvas = resized;
    ctx = resizedCtx;
  }

  // Step 3: Filters
  if (hasActiveFilters(settings.filter)) {
    const filterParts: string[] = [];
    const f = settings.filter;
    if (f.blur > 0) filterParts.push(`blur(${f.blur}px)`);
    if (f.brightness !== 100) filterParts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== 100) filterParts.push(`contrast(${f.contrast}%)`);
    if (f.grayscale > 0) filterParts.push(`grayscale(${f.grayscale}%)`);
    if (f.hueRotate !== 0) filterParts.push(`hue-rotate(${f.hueRotate}deg)`);
    if (f.invert > 0) filterParts.push(`invert(${f.invert}%)`);
    if (f.opacity < 100) filterParts.push(`opacity(${f.opacity}%)`);
    if (f.saturation !== 100) filterParts.push(`saturate(${f.saturation}%)`);
    if (f.sepia > 0) filterParts.push(`sepia(${f.sepia}%)`);

    const filtered = document.createElement('canvas');
    filtered.width = canvas.width;
    filtered.height = canvas.height;
    const filteredCtx = filtered.getContext('2d');
    if (!filteredCtx) throw new Error('Failed to get 2D context');
    filteredCtx.filter = filterParts.join(' ');
    filteredCtx.drawImage(canvas, 0, 0);
    canvas = filtered;
    ctx = filteredCtx;
  }

  // Step 4: Watermark
  if (settings.watermark) {
    const wm = settings.watermark;
    ctx.save();
    ctx.globalAlpha = wm.opacity / 100;

    if (wm.type === 'text') {
      const fontSize = Math.max(12, Math.round(wm.fontSize));
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = wm.fontColor;
      const metrics = ctx.measureText(wm.text);
      const textWidth = metrics.width;
      const textHeight =
        (metrics.actualBoundingBoxAscent ?? 0) +
          (metrics.actualBoundingBoxDescent ?? 0) || fontSize;
      const { x, y } = getWatermarkPosition(
        canvas.width,
        canvas.height,
        textWidth,
        textHeight,
        wm.position,
      );
      ctx.fillText(wm.text, x, y + textHeight * 0.8);
    } else if (wm.type === 'image' && wm.imageUrl) {
      const wmImg = new Image();
      wmImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        wmImg.onload = () => resolve();
        wmImg.onerror = () => reject(new Error('Failed to load watermark image'));
        wmImg.src = wm.imageUrl;
      });
      const scale = wm.imageScale / 100;
      const wmW = Math.round(wmImg.naturalWidth * scale);
      const wmH = Math.round(wmImg.naturalHeight * scale);
      const { x, y } = getWatermarkPosition(
        canvas.width,
        canvas.height,
        wmW,
        wmH,
        wm.position,
      );
      ctx.drawImage(wmImg, x, y, wmW, wmH);
    }

    ctx.restore();
  }

  // Step 5: Border
  if (settings.border && settings.border.width > 0) {
    const b = settings.border;
    const w = canvas.width;
    const h = canvas.height;
    const half = b.width / 2;
    const r = Math.min(b.radius, w / 2 - half, h / 2 - half);

    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.width;

    if (r > 0) {
      ctx.beginPath();
      const x0 = half;
      const y0 = half;
      const x1 = w - half;
      const y1 = h - half;
      ctx.moveTo(x0 + r, y0);
      ctx.lineTo(x1 - r, y0);
      ctx.arcTo(x1, y0, x1, y0 + r, r);
      ctx.lineTo(x1, y1 - r);
      ctx.arcTo(x1, y1, x1 - r, y1, r);
      ctx.lineTo(x0 + r, y1);
      ctx.arcTo(x0, y1, x0, y1 - r, r);
      ctx.lineTo(x0, y0 + r);
      ctx.arcTo(x0, y0, x0 + r, y0, r);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(half, half, w - b.width, h - b.width);
    }
  }

  if (settings.outputFormat === 'pdf') {
    const pdf = new jsPDF({
      unit: 'px',
      format: [canvas.width, canvas.height],
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(dataUrl, 'JPEG', 0, 0, canvas.width, canvas.height);
    const pdfBlob = pdf.output('blob');
    return { blob: pdfBlob, format: 'application/pdf' };
  }

  // Step 6: Compress / convert format
  const format = settings.outputFormat;
  const compress = settings.compress;
  let quality: number;

  if (compress.mode === 'lossless') {
    quality = 100;
  } else if (compress.mode === 'targetSize') {
    // Binary search quality for target file size
    const targetBytes = (compress.targetSizeKB ?? 100) * 1024;
    let lo = 10;
    let hi = 100;
    let bestBlob: Blob | null = null;

    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) >> 1;
      const blob = await encodeWithWasm(canvas, format, mid);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (Math.abs(blob.size - targetBytes) / targetBytes <= 0.05) {
        return { blob, format: getMimeType(format) };
      }

      if (blob.size > targetBytes) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }

      if (lo > hi) break;
    }

    if (!bestBlob) {
      throw new Error('Failed to compress to target size');
    }

    return { blob: bestBlob, format: getMimeType(format) };
  } else {
    quality = compress.quality;
  }

  if (compress.mode === 'quality' && format === 'png' && compress.quality < 100) {
    const colors = Math.max(2, Math.round(256 * compress.quality / 100));
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const quantized = quantizeColors(imageData, colors);
    ctx.putImageData(quantized, 0, 0);
  }

  let blob = await encodeWithWasm(canvas, format, quality);

  if (compress.mode === 'lossless' && format === 'png') {
    try {
      const pngFile = new File([blob], 'temp.png', { type: 'image/png' });
      const optimized = await losslessOptimizePng(pngFile);
      if (optimized.size < blob.size) {
        blob = optimized;
      }
    } catch {
      // Keep original blob
    }
  }

  return { blob, format: getMimeType(format) };
}

export async function generateThumbnail(
  file: File,
  maxSize: number = 200,
): Promise<string> {
  const img = await fileToImage(file);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  let targetW = iw;
  let targetH = ih;

  if (iw > maxSize || ih > maxSize) {
    const scale = maxSize / Math.max(iw, ih);
    targetW = Math.round(iw * scale);
    targetH = Math.round(ih * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return canvas.toDataURL('image/jpeg', 0.7);
}

export async function getImageDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
