import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SUPPORTED_INPUT_FORMATS, SUPPORTED_OUTPUT_FORMATS } from '../types/index';
import { getFormatLabel } from '../utils/formatUtils';
import { useSEO, InjectJSONLD } from '../utils/seo';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: '这个工具真的完全免费吗？',
    answer:
      '是的，ImageToolbox 永久免费使用。没有任何隐藏费用、高级会员或付费功能。所有功能对所有用户开放，无限使用次数。',
  },
  {
    question: '我的图片会上传到服务器吗？',
    answer:
      '绝对不会。所有图片处理均在您的浏览器本地完成，使用 WebAssembly 和 Canvas API 技术。您的图片文件从不会离开您的设备，我们没有任何服务器存储任何用户图片。这也是为什么我们不需要您注册账号 —— 因为根本就没有服务器端处理。',
  },
  {
    question: '支持哪些图片格式？',
    answer: (
      <div className="space-y-3">
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            输入格式（可读取）:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_INPUT_FORMATS.map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {getFormatLabel(fmt)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            输出格式（可转换）:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_OUTPUT_FORMATS.map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {getFormatLabel(fmt)}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    question: '可以批量处理图片吗？',
    answer:
      '可以。您可以一次性选择多个图片文件，或者上传包含多张图片的 ZIP 压缩包。在工作台中，所有任务会显示在任务列表中，您可以对每个任务单独设置参数，也可以选择"应用到全部"来统一设置。点击"开始处理"后会依次处理所有图片，完成后可以逐个下载或打包下载 ZIP。',
  },
  {
    question: '处理后的图片质量会下降吗？',
    answer:
      '这取决于您的设置。我们提供多种压缩和转换选项：无损压缩（PNG 格式）完全保留原始像素数据；有损压缩允许您调节质量参数（10%-100%），在质量和文件大小之间取得平衡；目标大小模式会自动寻找最优质量参数以达到您指定的文件大小。建议在压缩前保留原始文件备份。',
  },
  {
    question: '支持多大的图片文件？',
    answer:
      '理论上没有文件大小限制。但由于所有处理在浏览器内存中进行，实际处理能力受到您的设备内存和浏览器限制。对于超大图片（例如超过 10000x10000 像素或文件超过 100MB），处理速度可能会较慢，甚至可能因内存不足而失败。建议将超大图片分批处理。',
  },
  {
    question: '支持 HEIC/HEIF 格式吗？',
    answer:
      '支持。ImageToolbox 已内置 HEIC/HEIF 解码器，上传 HEIC 或 HEIF 图片后会自动解码为通用格式再进行后续处理。首次加载 HEIC 解码器需要下载约 1.3MB 的 WebAssembly 模块，后续使用无需再次下载。',
  },
  {
    question: '支持 SVG 文件吗？',
    answer:
      '支持将 SVG 作为输入格式。SVG 文件可以被读取并渲染为位图，然后进行裁剪、缩放、滤镜等处理，最终输出为 PNG、JPEG、WebP 等位图格式。注意：输出不会保留为 SVG 矢量格式（因为经过光栅化处理），如果您需要 SVG 矢量化，建议使用专门的 SVG 编辑工具。',
  },
  {
    question: '我的隐私数据安全吗？',
    answer:
      '绝对安全。所有图片处理完全在您的浏览器本地内存中进行，没有任何数据通过网络发送。您可以在处理前通过元数据查看功能检查图片中的 EXIF 信息（如 GPS 坐标、拍摄设备等），并在输出时选择清除这些元数据。处理过程中生成的临时 URL 和预览数据仅在当前页面有效，关闭页面后即被释放。',
  },
  {
    question: '遇到问题怎么办？',
    answer: (
      <div>
        <p>
          如果您遇到任何问题或有功能建议，可以通过以下方式联系：
        </p>
         <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-400">
          <li>
            请发送邮件至{' '}
            <a
              href="mailto:anony.neatly471@passfwd.com"
              className="text-brand-500 hover:text-brand-600 underline"
            >
              anony.neatly471@passfwd.com
            </a>
          </li>
          <li>查看浏览器控制台（F12）中的错误信息以帮助诊断</li>
          <li>尝试使用最新版本的 Chrome、Firefox 或 Edge 浏览器</li>
          <li>对于大文件，尝试分批次处理以降低内存压力</li>
        </ul>
      </div>
    ),
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useSEO({
    title: '常见问题 - ImageToolbox | 免费在线图片处理工具箱FAQ',
    description: 'ImageToolbox免费在线图片处理工具箱常见问题解答：是否免费、图片是否上传、支持格式、批量处理、文件大小限制、隐私安全等。',
    keywords: '图片处理FAQ,在线图片工具常见问题,图片压缩问题,格式转换问题,图片隐私安全',
  });

  const faqJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': typeof item.answer === 'string' ? item.answer : item.question,
      },
    })),
  };

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={faqJSONLD} />
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Page Title */}
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 text-brand-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              常见问题
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              关于 ImageToolbox 的常见问题解答
            </p>
          </section>

          {/* FAQ Items */}
          <section className="space-y-4 pb-12">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="card overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4"
                  >
                    <span className="text-base font-semibold text-slate-900 dark:text-white pr-4">
                      {item.question}
                    </span>
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-transform duration-200">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 animate-slide-up">
                      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {typeof item.answer === 'string' ? (
                          <p>{item.answer}</p>
                        ) : (
                          item.answer
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
