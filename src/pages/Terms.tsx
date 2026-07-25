import {
  Gift,
  AlertTriangle,
  Ban,
  BookOpen,
  Clock,
  FileText,
  Scale,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO, InjectJSONLD } from '../utils/seo';

const SECTIONS = [
  {
    icon: Gift,
    title: '免费声明',
    content:
      'ImageToolbox 是一款永久免费的图片处理工具。所有功能（包括但不限于格式转换、图片压缩、裁剪、滤镜、水印添加、元数据处理等）均对所有用户免费开放，无使用次数限制，无强制注册要求。我们承诺不会对任何现有免费功能收取费用。如果未来推出额外的高级功能，我们将通过明确的方式告知用户，且不会影响您已享有的免费功能。',
  },
  {
    icon: AlertTriangle,
    title: '免责声明',
    content:
      '本工具按"现状"提供，不提供任何明示或暗示的保证。我们不保证：工具始终无间断运行或完全无错误；处理结果完全符合您的预期；所有格式的图片都能被正确处理。由于所有处理在浏览器本地完成，处理能力和稳定性取决于您的设备和浏览器环境。强烈建议您在处理重要图片前，先保留原始文件的备份。因使用本工具导致的任何数据丢失、损坏或其他损失，本工具及开发者不承担任何责任。',
  },
  {
    icon: Ban,
    title: '禁止用途',
    content:
      '您不得使用本工具处理以下内容：涉及违法、暴力、恐怖主义等违法违规内容的图片；侵犯他人著作权、商标权、肖像权等知识产权的图片（除非您已获得权利人的合法授权）；用于欺诈、虚假信息传播、网络钓鱼等恶意行为的图片；任何违反中华人民共和国法律法规及您所在地区法律的图片内容。如发现用户利用本工具进行上述禁止用途，我们将保留采取必要法律措施的权利。',
  },
  {
    icon: BookOpen,
    title: '知识产权',
    content:
      'ImageToolbox 工具本身的源代码采用 MIT 开源许可证发布，您可以自由地使用、修改和分发（需保留原始版权声明）。您使用本工具生成的图片内容和处理结果的知识产权完全属于您自己。我们不会对用户生成的内容主张任何权利。本工具使用到的第三方开源库的知识产权归各自作者所有。',
  },
  {
    icon: Clock,
    title: '服务可用性',
    content:
      '本工具基于静态网页技术，无需服务器端进行图片处理，理论上可以无限期离线使用（通过 PWA 技术）。但我们不承诺 100% 的服务可用性，也不保证在所有浏览器和所有设备上都能完美运行。以下情况可能导致服务中断或异常：您的网络连接问题、浏览器兼容性问题、设备性能不足、CDN 或托管服务的故障。我们会在力所能及的范围内尽快解决影响用户体验的问题。',
  },
  {
    icon: FileText,
    title: '条款修改',
    content:
      '我们保留随时修改本使用条款的权利。条款的重大变更将通过以下方式通知：网站页面的公告栏更新。修改后的条款自发布之日起生效。如果您在条款修改后继续使用本工具，即表示您接受修改后的条款。建议您定期查阅本页面以了解最新的使用条款内容。',
  },
];

export default function Terms() {
  useSEO({
    title: '使用条款 - ImageToolbox | 免费图片处理工具使用协议',
    description: 'ImageToolbox使用条款：永久免费声明、免责声明、禁止用途、知识产权、服务可用性说明。纯本地图片处理，无隐藏费用。',
    keywords: '免费工具使用条款,图片处理工具协议,在线工具使用条款',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': '使用条款 - ImageToolbox',
        'description': 'ImageToolbox使用条款：永久免费声明及免责条款。',
        'url': 'https://imagetoolbox.pages.dev/terms',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Title */}
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
              <Scale className="w-7 h-7 text-sky-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              使用条款
            </h1>
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              最后更新日期: 2026年6月1日
            </p>
          </div>

          {/* Introduction */}
          <div className="card p-6 sm:p-8 mb-8">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              欢迎使用 ImageToolbox。请在使用本工具前仔细阅读以下使用条款。访问或使用本工具即表示您同意遵守本条款的约束。如果您不同意本条款的任何部分，请停止使用本工具。
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="card p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        {section.title}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-10 text-center space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              如果您对本使用条款有任何疑问，请发送邮件至 anony.neatly471@passfwd.com
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              本使用条款的最终解释权归 ImageToolbox 开发者所有。
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
