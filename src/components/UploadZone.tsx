import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Link, Loader2, AlertCircle } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { extractImagesFromZip } from '../utils/zipUtils';
import { useT } from '../i18n/useT';

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export default function UploadZone({ onFilesAdded }: UploadZoneProps) {
  const { addTasks } = useTaskStore();
  const t = useT();
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      const imageFiles: File[] = [];
      let hasZip = false;

      for (const file of files) {
        if (
          file.name.endsWith('.zip') ||
          file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed'
        ) {
          hasZip = true;
          try {
            setZipLoading(true);
            setZipError('');
            const { files: extracted } = await extractImagesFromZip(file);
            if (extracted.length === 0) {
              setZipError(t('upload.zipNoImages'));
            }
            imageFiles.push(...extracted);
          } catch {
            setZipError(t('upload.zipError'));
          } finally {
            setZipLoading(false);
          }
        } else if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        await addTasks(imageFiles);
        onFilesAdded(imageFiles);
      }

      if (!hasZip && imageFiles.length === 0) {
        setZipError(t('upload.invalidFile'));
        setTimeout(() => setZipError(''), 3000);
      }
    },
    [addTasks, onFilesAdded],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [processFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files ?? []);
      if (selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles],
  );

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleUrlFetch = async () => {
    const url = urlInput.trim();
    if (!url) return;

    setUrlLoading(true);
    setUrlError('');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        throw new Error(t('upload.invalidUrl'));
      }

      const blob = await response.blob();
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const rawName = pathParts[pathParts.length - 1] || 'image';
      const extMatch = rawName.match(/\.([a-zA-Z0-9]+)$/);
      const fileName = extMatch
        ? rawName
        : `${rawName}.${blob.type.split('/')[1] || 'png'}`;

      const file = new File([blob], fileName, { type: blob.type });
      await addTasks([file]);
      onFilesAdded([file]);
      setUrlInput('');
    } catch (err) {
      setUrlError(
        err instanceof Error ? err.message : t('upload.fetchError'),
      );
    } finally {
      setUrlLoading(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUrlFetch();
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      const items = e.clipboardData.items;
      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = item.type.split('/')[1] || 'png';
            const fileName = `clipboard-${Date.now()}.${ext}`;
            const file = new File([blob], fileName, { type: item.type });
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  const isLoading = zipLoading || urlLoading;

  return (
    <div className="w-full">
      <div
        ref={dropRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'drag-over border-brand-500 bg-brand-50/10 dark:bg-brand-500/5'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-brand-400 dark:hover:border-brand-600'
        }`}
        onClick={handleClickUpload}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.zip"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label={t('upload.ariaLabel')}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {zipLoading ? t('upload.unzipping') : t('upload.fetching')}
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-brand-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                {t('upload.title')}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {t('upload.formats')}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClickUpload();
              }}
              className="btn-primary text-sm px-5 py-2.5"
            >
              {t('upload.or')}{t('upload.click')}
            </button>
          </>
        )}
      </div>

      {(zipError || urlError) && (
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{zipError || urlError}</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <Link className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder={t('upload.url')}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleUrlFetch();
          }}
          disabled={urlLoading || !urlInput.trim()}
          className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {urlLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('upload.fetch')
          )}
        </button>
      </div>
    </div>
  );
}
