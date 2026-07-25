import { Shield, Cookie, Database, Globe, Lock, FileLock, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO, InjectJSONLD } from '../utils/seo';

const SECTIONS = [
  {
    icon: Database,
    title: '数据收集',
    content:
      '我们不会收集任何个人数据。ImageToolbox 不需要您创建账号，不会索取您的任何个人信息（如姓名、电子邮件、手机号码等）。您上传的图片文件完全在浏览器本地处理，不会上传到任何服务器，我们也不会记录您的使用行为或处理历史。',
  },
  {
    icon: Cookie,
    title: 'Cookie 使用',
    content:
      '本网站仅使用必要的本地存储（localStorage）来保存您的主题偏好设置（明亮/暗黑模式）。我们不使用任何跟踪 Cookie、分析 Cookie 或广告 Cookie。您可以通过浏览器设置清除本地存储数据。',
  },
  {
    icon: Globe,
    title: '本地存储',
    content:
      '我们使用浏览器的 localStorage 仅存储以下数据：主题偏好（明亮/暗黑/跟随系统）和用户偏好设置。这些数据完全存储在您的设备上，不会同步到任何服务器。清除浏览器数据或切换浏览器的隐私模式后，这些数据将会丢失。',
  },
  {
    icon: Shield,
    title: '第三方服务',
    content:
      '本网站不使用任何第三方分析工具（如 Google Analytics）、广告服务、社交媒体追踪器或热力图工具。我们不会将任何数据分享给第三方，因为我们本身就不收集任何用户数据。',
  },
  {
    icon: FileLock,
    title: '数据处理',
    content:
      '所有图片处理均通过浏览器的 Canvas API 和 WebAssembly 技术在您的设备本地完成。处理流程为：文件加载到浏览器内存 → Canvas 渲染 → 应用处理操作 → 生成结果。整个过程中，图片数据从未离开您的浏览器内存空间。处理完成后，临时数据和预览 URL 在页面关闭时自动释放。',
  },
  {
    icon: Lock,
    title: '数据安全',
    content:
      '由于所有数据都在本地处理，不存在服务器数据泄露的风险。您的原始文件和生成结果都保存在您的设备本地。我们建议您对重要文件做好本地备份。在网络环境中使用时，本网站通过 HTTPS 加密传输静态资源，但图片文件本身不通过网络传输。',
  },
  {
    icon: Mail,
    title: '联系我们',
    content:
      '如果您对本隐私政策有任何疑问、建议或发现安全漏洞，请通过以下方式联系我们：发送邮件至 anony.neatly471@passfwd.com。我们非常重视用户隐私，将及时回复您的关切。',
  },
];

export default function Privacy() {
  useSEO({
    title: '隐私协议 - ImageToolbox | 纯本地处理用户隐私保护承诺',
    description: 'ImageToolbox隐私协议：所有图片处理在浏览器本地完成，不上传任何服务器。不收集个人信息，不使用追踪Cookie，仅localStorage存储主题偏好。',
    keywords: '图片处理隐私,在线工具隐私协议,本地处理隐私,图片不上传服务器',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': '隐私协议 - ImageToolbox',
        'description': 'ImageToolbox隐私协议：纯本地处理，不收集用户数据。',
        'url': 'https://imagetoolbox.pages.dev/privacy',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Title */}
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              隐私协议
            </h1>
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              最后更新日期: 2026年6月1日
            </p>
          </div>

          {/* Introduction */}
          <div className="card p-6 sm:p-8 mb-8">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              本隐私协议说明了 ImageToolbox（以下简称"本工具"）如何收集、使用和保护您的信息。使用本工具即表示您同意本隐私协议的条款。我们深知隐私的重要性，因此设计了完全本地化的处理架构，确保您的数据安全。
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="card p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-emerald-500" />
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
          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              本隐私协议可能随时更新。重大变更时，我们会通过网站公告通知用户。建议您定期查看本页面以了解最新信息。
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
