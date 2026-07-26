export type Lang = 'zh-CN' | 'en';

export const translations: Record<Lang, Record<string, string>> = {
  'zh-CN': {
    // Header
    'nav.home': '首页',
    'nav.workspace': '工作台',
    'nav.faq': '常见问题',
    'header.privacy': '本地处理 · 隐私安全',
    'header.feedback': '意见反馈',

    // Home
    'home.title': '图片处理，从未如此简单',
    'home.subtitle': '纯本地处理，您的图片不会上传到任何服务器，隐私绝对安全',
    'home.cta': '开始使用',
    'home.feature1.title': '格式转换',
    'home.feature1.desc': 'PNG、JPEG、WebP、AVIF 等格式互转，支持批量处理',
    'home.feature2.title': '图片压缩',
    'home.feature2.desc': '智能压缩，支持有损/目标大小模式',
    'home.feature3.title': '裁剪',
    'home.feature3.desc': '自由裁剪、预设比例、精确像素裁剪',
    'home.feature4.title': '滤镜特效',
    'home.feature4.desc': '亮度、对比度、饱和度等专业调整',
    'home.badge1': '永久免费',
    'home.badge2': '本地处理',
    'home.badge3': '无需注册',
    'home.badge4': '支持批量',
    'home.badge5': '无文件限制',

    // Upload
    'upload.title': '拖拽图片到此处',
    'upload.or': '或',
    'upload.click': '点击上传',
    'upload.url': '输入图片直链地址',
    'upload.fetch': '获取',

    // Toolbar
    'toolbar.convert': '格式转换',
    'toolbar.compress': '压缩',
    'toolbar.crop': '裁剪',
    'toolbar.resize': '调整尺寸',
    'toolbar.filter': '滤镜',
    'toolbar.watermark': '水印',
    'toolbar.border': '边框',
    'toolbar.merge': '合并',
    'toolbar.split': '切割',
    'toolbar.roundCorners': '圆角',
    'toolbar.mirror': '镜像',
    'toolbar.mosaic': '马赛克',
    'toolbar.compare': '对比',
    'toolbar.exif': '元数据',
    'toolbar.removeBg': '去背景',
    'toolbar.gif': 'GIF',
    'toolbar.ocr': '文字识别',
    'toolbar.outputFormat': '→',
    'toolbar.start': '开始处理',
    'toolbar.processing': '处理中...',
    'toolbar.downloadAll': '全部下载',
    'toolbar.downloadZip': '打包下载ZIP',
    'toolbar.continueWithResult': '以结果继续',
    'toolbar.reprocess': '重新处理',
    'toolbar.completed': '处理完成',
    'toolbar.pending': '待处理任务',

    // Task
    'task.empty': '还没有添加图片',
    'task.emptyHint': '拖拽图片到上方区域开始',
    'task.count': '个任务',
    'task.clearAll': '清空全部',
    'task.completed': '完成',
    'task.pending': '待处理',
    'task.processing': '处理中',

    // Footer
    'footer.desc': '永久免费在线图片处理工具箱，所有处理均在浏览器本地完成。',
    'footer.faq': '常见问题',
    'footer.privacy': '隐私协议',
    'footer.terms': '使用条款',
    'footer.feedback': '反馈',
    'footer.copyright': '永久免费 · 本地处理 · 隐私安全',

    // Common
    'common.apply': '应用',
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.download': '下载',
    'common.copy': '复制',
    'common.reset': '重置',
    'common.preview': '预览',

    // Workspace SEO
    'workspace.seoTitle': '工作台 - 批图网 | 在线图片批量处理工具箱',
    'workspace.seoDesc': '批图网工作台，一站式在线图片处理：格式转换、压缩、裁剪、滤镜、水印、边框、合并、切割等20+功能。支持批量处理，纯本地运行。',
    'workspace.seoKeywords': '图片处理,批量处理,在线图片编辑,图片转换压缩裁剪,批图网',

    // Home SEO
    'home.seoTitle': '批图网 - 永久免费在线图片批量处理工具箱 | 保护隐私免费批量处理',
    'home.seoDesc': '批图网，永久免费在线图片批量处理工具箱。纯本地处理不上传服务器，支持20+图片处理功能。批量压缩、格式转换、裁剪、滤镜、水印，保护您的隐私。',
    'home.seoKeywords': '批图网,免费图片处理,批量图片处理,在线图片处理,图片压缩,格式转换,隐私保护',

    // Theme
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '系统',
  },

  'en': {
    'nav.home': 'Home',
    'nav.workspace': 'Workspace',
    'nav.faq': 'FAQ',
    'header.privacy': 'Local Processing · Privacy Safe',
    'header.feedback': 'Feedback',

    'home.title': 'Image Processing Made Simple',
    'home.subtitle': '100% local processing. Your images never leave your device. Privacy guaranteed.',
    'home.cta': 'Get Started',
    'home.feature1.title': 'Format Convert',
    'home.feature1.desc': 'Convert between PNG, JPEG, WebP, AVIF and more. Batch supported.',
    'home.feature2.title': 'Compress',
    'home.feature2.desc': 'Smart compression with quality and target size modes.',
    'home.feature3.title': 'Crop',
    'home.feature3.desc': 'Free crop, preset ratios, exact pixel cropping.',
    'home.feature4.title': 'Filters',
    'home.feature4.desc': 'Brightness, contrast, saturation and more adjustments.',
    'home.badge1': 'Free Forever',
    'home.badge2': 'Local Processing',
    'home.badge3': 'No Registration',
    'home.badge4': 'Batch Support',
    'home.badge5': 'No File Limit',

    'upload.title': 'Drag images here',
    'upload.or': 'or',
    'upload.click': 'Click to upload',
    'upload.url': 'Enter image URL',
    'upload.fetch': 'Fetch',

    'toolbar.convert': 'Convert',
    'toolbar.compress': 'Compress',
    'toolbar.crop': 'Crop',
    'toolbar.resize': 'Resize',
    'toolbar.filter': 'Filter',
    'toolbar.watermark': 'Watermark',
    'toolbar.border': 'Border',
    'toolbar.merge': 'Merge',
    'toolbar.split': 'Split',
    'toolbar.roundCorners': 'Round',
    'toolbar.mirror': 'Mirror',
    'toolbar.mosaic': 'Mosaic',
    'toolbar.compare': 'Compare',
    'toolbar.exif': 'Metadata',
    'toolbar.removeBg': 'Remove BG',
    'toolbar.gif': 'GIF',
    'toolbar.ocr': 'OCR',
    'toolbar.outputFormat': '→',
    'toolbar.start': 'Start',
    'toolbar.processing': 'Processing...',
    'toolbar.downloadAll': 'Download All',
    'toolbar.downloadZip': 'Download ZIP',
    'toolbar.continueWithResult': 'Continue with Result',
    'toolbar.reprocess': 'Reprocess',
    'toolbar.completed': 'completed',
    'toolbar.pending': 'pending',

    'task.empty': 'No images added yet',
    'task.emptyHint': 'Drag images to the area above to start',
    'task.count': 'tasks',
    'task.clearAll': 'Clear All',
    'task.completed': 'Done',
    'task.pending': 'Pending',
    'task.processing': 'Processing',

    'footer.desc': 'Free online image processing toolbox. All processing done locally in your browser.',
    'footer.faq': 'FAQ',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.feedback': 'Feedback',
    'footer.copyright': 'Free Forever · Local Processing · Privacy Safe',

    'common.apply': 'Apply',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.download': 'Download',
    'common.copy': 'Copy',
    'common.reset': 'Reset',
    'common.preview': 'Preview',

    'workspace.seoTitle': 'Workspace - ppic.cc | Free Online Batch Image Processing Toolbox',
    'workspace.seoDesc': 'ppic.cc workspace: format conversion, compression, crop, filters, watermark, border, merge, split and 20+ tools. Batch processing, 100% local.',
    'workspace.seoKeywords': 'image processing,batch processing,online image editor,image converter,free',

    'home.seoTitle': 'ppic.cc - Free Online Batch Image Processing Toolbox | Privacy Protected',
    'home.seoDesc': 'ppic.cc, free forever online batch image processing toolbox. 100% local, no server upload. 20+ tools: compression, format conversion, crop, filters, watermark. Your privacy is protected.',
    'home.seoKeywords': 'free image processing,batch image processing,online image tool,image compression,format converter,privacy',

    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
  },
};

export function getLangFromNavigator(): Lang {
  const lang = navigator.language || 'zh-CN';
  if (lang.startsWith('zh')) return 'zh-CN';
  return 'en';
}

export function t(lang: Lang, key: string): string {
  return translations[lang]?.[key] || translations['zh-CN'][key] || key;
}
