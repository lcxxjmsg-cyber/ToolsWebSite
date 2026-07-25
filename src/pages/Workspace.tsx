import { useState, useCallback } from 'react';
import type { ToolMode } from '../types/index';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import Toolbar from '../components/Toolbar';
import TaskList from '../components/TaskList';
import CropModal from '../components/CropModal';
import ResizeModal from '../components/ResizeModal';
import CompressModal from '../components/CompressModal';
import ConvertModal from '../components/ConvertModal';
import FilterModal from '../components/FilterModal';
import WatermarkModal from '../components/WatermarkModal';
import BorderModal from '../components/BorderModal';
import OcrModal from '../components/OcrModal';
import { useTaskStore } from '../store/taskStore';
import { useSEO, InjectJSONLD } from '../utils/seo';

export default function Workspace() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  useSEO({
    title: '工作台 - ImageToolbox | 在线图片批量处理工具箱',
    description: 'ImageToolbox工作台，一站式在线图片处理：格式转换、压缩、裁剪、调整尺寸、滤镜特效、水印、边框。支持批量处理，纯本地运行。',
    keywords: '图片处理工作台,批量图片处理,在线图片编辑,图片转换压缩裁剪,一站式图片工具',
  });
  const { tasks } = useTaskStore();

  const hasTasks = tasks.length > 0;

  const handleToolChange = useCallback(
    (tool: ToolMode) => {
      setActiveModal(tool);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleFilesAdded = useCallback(() => {
    // Files are added via UploadZone's built-in addTasks call
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': '工作台 - ImageToolbox',
        'description': '一站式在线图片批量处理工具箱，格式转换、压缩、裁剪、滤镜等。',
        'url': 'https://imagetoolbox.pages.dev/workspace',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Upload Zone */}
          <div
            className={
              hasTasks
                ? 'opacity-60 hover:opacity-100 transition-opacity'
                : ''
            }
          >
            {hasTasks ? (
              <div className="card p-4">
                <UploadZone onFilesAdded={handleFilesAdded} />
              </div>
            ) : (
              <div className="py-12">
                <div className="max-w-2xl mx-auto">
                  <UploadZone onFilesAdded={handleFilesAdded} />
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">或拖拽图片到上方区域开始处理</p>
                </div>
              </div>
            )}
          </div>

          {/* Toolbar */}
          {hasTasks && (
            <Toolbar onToolChange={handleToolChange} />
          )}

          {/* Task List */}
          {hasTasks && <TaskList />}
        </div>
      </main>

      {/* Modals */}
      <CropModal
        isOpen={activeModal === 'crop'}
        onClose={handleCloseModal}
      />
      <ResizeModal
        isOpen={activeModal === 'resize'}
        onClose={handleCloseModal}
      />
      <CompressModal
        isOpen={activeModal === 'compress'}
        onClose={handleCloseModal}
      />
      <ConvertModal
        isOpen={activeModal === 'convert'}
        onClose={handleCloseModal}
      />
      <FilterModal
        isOpen={activeModal === 'filter'}
        onClose={handleCloseModal}
      />
      <WatermarkModal
        isOpen={activeModal === 'watermark'}
        onClose={handleCloseModal}
      />
      <BorderModal
        isOpen={activeModal === 'border'}
        onClose={handleCloseModal}
      />
      <OcrModal
        isOpen={activeModal === 'ocr'}
        onClose={handleCloseModal}
      />

      <Footer />
    </div>
  );
}
