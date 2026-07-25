import { useState, useCallback } from 'react';
import { Trash2, ImageIcon, GripVertical } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import TaskCard from './TaskCard';

export default function TaskList() {
  const {
    tasks,
    setSelectedTaskId,
    reorderTasks,
    clearTasks,
  } = useTaskStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      setDragIndex(index);
      (e.currentTarget as HTMLElement).style.opacity = '0.5';
    },
    [],
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = Number(e.dataTransfer.getData('text/plain'));
      if (fromIndex !== toIndex) {
        reorderTasks(fromIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [reorderTasks],
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-1">
          还没有添加图片
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          拖拽图片到上方区域开始
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          共 {tasks.length} 个任务
        </span>

        <button
          onClick={clearTasks}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          清空全部
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`animate-slide-up relative ${
              dragOverIndex === index && dragIndex !== index
                ? 'ring-2 ring-brand-500 rounded-2xl'
                : ''
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 group-hover:opacity-50 transition-opacity cursor-grab">
              <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
            <TaskCard
              task={task}
              onClick={() => setSelectedTaskId(task.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
