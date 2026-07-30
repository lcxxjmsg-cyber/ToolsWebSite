import { Link } from 'react-router-dom';
import { Lock, Flame, MessageSquare, ArrowRightLeft, Link as LinkIcon, Hash, Braces, Fingerprint, Clock } from 'lucide-react';
import { useT } from '../../i18n/useT';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const TOOL_CATEGORIES = [
  {
    key: 'tools.cat.encoding',
    icon: ArrowRightLeft,
    tools: [
      { to: '/tools/base64', key: 'tools.base64', icon: ArrowRightLeft, desc: 'tools.base64.desc' },
      { to: '/tools/url-encode', key: 'tools.urlencode', icon: LinkIcon, desc: 'tools.urlencode.desc' },
    ],
  },
  {
    key: 'tools.cat.conversion',
    icon: Hash,
    tools: [
      { to: '/tools/base-convert', key: 'tools.baseconvert', icon: Hash, desc: 'tools.baseconvert.desc' },
      { to: '/tools/json-format', key: 'tools.jsonformat', icon: Braces, desc: 'tools.jsonformat.desc' },
    ],
  },
  {
    key: 'tools.cat.dev',
    icon: Fingerprint,
    tools: [
      { to: '/tools/uuid', key: 'tools.uuid', icon: Fingerprint, desc: 'tools.uuid.desc' },
      { to: '/tools/timestamp', key: 'tools.timestamp', icon: Clock, desc: 'tools.timestamp.desc' },
    ],
  },
  {
    key: 'tools.cat.security',
    icon: Lock,
    tools: [
      { to: '/tools/burn', key: 'tools.burn', icon: Flame, desc: 'tools.burn.desc' },
    ],
  },
  {
    key: 'tools.cat.communication',
    icon: MessageSquare,
    tools: [
      { to: '/tools/chat', key: 'tools.chat', icon: MessageSquare, desc: 'tools.chat.desc' },
    ],
  },
];

export default function ToolsIndex() {
  const t = useT();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('tools.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('tools.subtitle')}</p>
        </div>

        <div className="space-y-10">
          {TOOL_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <section key={cat.key}>
                <div className="flex items-center gap-2 mb-4">
                  <CatIcon className="w-5 h-5 text-brand-500" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t(cat.key)}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.to}
                        to={tool.to}
                        className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-md group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20 transition-colors">
                          <ToolIcon className="w-5 h-5 text-brand-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">{t(tool.key)}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t(tool.desc)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
