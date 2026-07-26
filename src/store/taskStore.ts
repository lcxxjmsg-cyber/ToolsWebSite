import { create } from 'zustand';
import type { TaskItem, TaskSettings, TaskStatus, ImageFormat } from '../types/index';
import { DEFAULT_TASK_SETTINGS, SUPPORTED_OUTPUT_FORMATS } from '../types/index';
import { generateThumbnail } from '../utils/imageProcessor';
import { getFileExtension, getFormatLabel, getFormatFromExtension } from '../utils/formatUtils';
import { isDocumentFile, convertDocumentToImage } from '../utils/documentConverter';

interface TaskStore {
  tasks: TaskItem[];
  isProcessing: boolean;
  overallProgress: number;
  selectedTaskId: string | null;

  addTasks: (files: File[]) => Promise<void>;
  removeTask: (id: string) => void;
  clearTasks: () => void;
  updateTaskSettings: (id: string, settings: Partial<TaskSettings>) => void;
  updateAllTasksSettings: (settings: Partial<TaskSettings>) => void;
  setTaskStatus: (id: string, status: TaskStatus, errorMessage?: string) => void;
  setTaskProgress: (id: string, progress: number) => void;
  setTaskResult: (id: string, blob: Blob, size: number) => void;
  startProcessing: () => void;
  finishProcessing: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  getTaskById: (id: string) => TaskItem | undefined;
  setSelectedTaskId: (id: string | null) => void;
  resetResults: () => void;
  replaceWithResults: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isProcessing: false,
  overallProgress: 0,
  selectedTaskId: null,

  addTasks: async (files: File[]) => {
    const newTasks: TaskItem[] = [];

    for (const file of files) {
      if (isDocumentFile(file)) {
        try {
          const imageFiles = await convertDocumentToImage(file);
          for (const imageFile of imageFiles) {
            const id = crypto.randomUUID();

            let thumbnail = '';
            try { thumbnail = await generateThumbnail(imageFile, 200); } catch { thumbnail = ''; }

            newTasks.push({
              id, file: imageFile, fileName: imageFile.name,
              originalSize: imageFile.size, originalFormat: `PNG ← ${file.name}`,
              thumbnail, status: 'pending', progress: 0,
              settings: { ...DEFAULT_TASK_SETTINGS },
            });
          }
        } catch {
          continue;
        }
      } else {
        const id = crypto.randomUUID();
        const ext = getFileExtension(file.name);
        let fmt = getFormatFromExtension(ext);
        if (fmt === 'jpeg') fmt = 'jpg';
        if (!SUPPORTED_OUTPUT_FORMATS.includes(fmt as never)) fmt = 'png';
        const settings = { ...DEFAULT_TASK_SETTINGS, outputFormat: fmt as ImageFormat };

        let thumbnail = '';
        try { thumbnail = await generateThumbnail(file, 200); } catch { thumbnail = ''; }

        newTasks.push({
          id, file, fileName: file.name,
          originalSize: file.size, originalFormat: getFormatLabel(ext),
          thumbnail, status: 'pending', progress: 0,
          settings,
        });
      }
    }

    set((state) => {
      const tasks = [...state.tasks, ...newTasks];
      return {
        tasks,
        selectedTaskId:
          state.selectedTaskId ?? (newTasks.length > 0 ? newTasks[0].id : null),
      };
    });
  },

  removeTask: (id: string) => {
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      const selectedTaskId =
        state.selectedTaskId === id
          ? (tasks.length > 0 ? tasks[0].id : null)
          : state.selectedTaskId;
      return { tasks, selectedTaskId };
    });
  },

  clearTasks: () => {
    set({ tasks: [], selectedTaskId: null, overallProgress: 0 });
  },

  updateTaskSettings: (id: string, settings: Partial<TaskSettings>) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, settings: { ...t.settings, ...settings } } : t,
      ),
    }));
  },

  updateAllTasksSettings: (settings: Partial<TaskSettings>) => {
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        settings: { ...t.settings, ...settings },
      })),
    }));
  },

  setTaskStatus: (id: string, status: TaskStatus, errorMessage?: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              errorMessage: status === 'error' ? errorMessage : undefined,
              progress: status === 'completed' ? 100 : t.progress,
            }
          : t,
      ),
    }));
  },

  setTaskProgress: (id: string, progress: number) => {
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id ? { ...t, progress: Math.min(100, Math.max(0, progress)) } : t,
      );
      const totalProgress =
        tasks.length > 0
          ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
          : 0;
      return { tasks, overallProgress: totalProgress };
    });
  },

  setTaskResult: (id: string, blob: Blob, size: number) => {
    const url = URL.createObjectURL(blob);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              resultBlob: blob,
              resultSize: size,
              resultUrl: url,
              status: 'completed',
              progress: 100,
            }
          : t,
      ),
    }));
  },

  startProcessing: () => {
    set({ isProcessing: true, overallProgress: 0 });
  },

  finishProcessing: () => {
    set({ isProcessing: false, overallProgress: 100 });
  },

  selectAll: () => {
    const { tasks } = get();
    set({ selectedTaskId: tasks.length > 0 ? tasks[0].id : null });
  },

  deselectAll: () => {
    set({ selectedTaskId: null });
  },

  reorderTasks: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const tasks = [...state.tasks];
      if (
        fromIndex < 0 ||
        fromIndex >= tasks.length ||
        toIndex < 0 ||
        toIndex >= tasks.length
      ) {
        return state;
      }
      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, moved);
      return { tasks };
    });
  },

  getTaskById: (id: string) => {
    return get().tasks.find((t) => t.id === id);
  },

  setSelectedTaskId: (id: string | null) => {
    set({ selectedTaskId: id });
  },

  resetResults: () => {
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        status: 'pending' as const,
        progress: 0,
        errorMessage: undefined,
        resultBlob: undefined,
        resultSize: undefined,
        resultUrl: undefined,
      })),
      isProcessing: false,
      overallProgress: 0,
    }));
  },

  replaceWithResults: () => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.status === 'completed' && t.resultBlob) {
          const ext = t.settings.outputFormat || 'png';
          const baseName = t.fileName.replace(/\.[^.]+$/, '');
          const newName = `${baseName}.${ext}`;
          const newFile = new File([t.resultBlob], newName, { type: t.resultBlob.type || 'image/png' });
          if (t.resultUrl) {
            URL.revokeObjectURL(t.resultUrl);
          }
          return {
            ...t,
            file: newFile,
            fileName: newName,
            originalSize: t.resultSize || t.originalSize,
            originalFormat: ext.toUpperCase(),
            status: 'pending' as const,
            progress: 0,
            errorMessage: undefined,
            resultBlob: undefined,
            resultSize: undefined,
            resultUrl: undefined,
            settings: {
              ...t.settings,
              compress: {
                mode: DEFAULT_TASK_SETTINGS.compress.mode,
                quality: DEFAULT_TASK_SETTINGS.compress.quality,
              },
            },
          };
        }
        return t;
      }),
      isProcessing: false,
      overallProgress: 0,
    }));
  },
}));
