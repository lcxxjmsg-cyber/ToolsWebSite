import JSZip from 'jszip';
import { isValidImageFile } from './formatUtils';
import { getFileExtension } from './formatUtils';
import { isDocumentFile } from './documentConverter';

export async function extractImagesFromZip(
  zipFile: File,
): Promise<{ files: File[]; structure: Map<string, string> }> {
  const zip = new JSZip();
  await zip.loadAsync(zipFile);

  const files: File[] = [];
  const structure = new Map<string, string>();

  const entries = Object.entries(zip.files);

  const mimeTypeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    heif: 'image/heif',
    txt: 'text/plain',
    html: 'text/html',
    htm: 'text/html',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
  };

  for (const [path, entry] of entries) {
    if (entry.dir) continue;

    const ext = getFileExtension(path);
    if (!ext) continue;

    const mimeType = mimeTypeMap[ext.toLowerCase()];
    if (!mimeType) continue;

    const blob = await entry.async('blob');
    const fileName = path.split('/').pop() || path;
    const file = new File([blob], fileName, { type: mimeType });

    if (isValidImageFile(file) || isDocumentFile(file)) {
      files.push(file);
      structure.set(fileName, path);
    }
  }

  return { files, structure };
}

export async function createZipFromResults(
  results: { fileName: string; blob: Blob }[],
  preserveStructure: boolean = false,
): Promise<Blob> {
  const zip = new JSZip();

  for (const result of results) {
    // Ensure unique filenames even if there are duplicates
    let filePath = result.fileName;

    if (preserveStructure) {
      // Use the fileName as-is if it contains path separators
    }

    // If there's a naming collision, append a counter
    const existing = zip.file(filePath);
    if (existing) {
      const baseName = result.fileName.replace(/\.[^.]+$/, '');
      const ext = getFileExtension(result.fileName);
      let counter = 1;
      let newPath = `${baseName}_${counter}.${ext}`;
      while (zip.file(newPath)) {
        counter++;
        newPath = `${baseName}_${counter}.${ext}`;
      }
      filePath = newPath;
    }

    zip.file(filePath, result.blob);
  }

  return zip.generateAsync({ type: 'blob' });
}
