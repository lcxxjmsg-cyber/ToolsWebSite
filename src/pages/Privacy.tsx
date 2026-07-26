import { Shield, Cookie, Database, Globe, Lock, FileLock, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useT } from '../i18n/useT';
import { useSEO, InjectJSONLD } from '../utils/seo';

const SECTIONS = [
  { icon: Database, titleKey: 'privacy.section1.title', contentKey: 'privacy.section1.content' },
  { icon: Cookie, titleKey: 'privacy.section2.title', contentKey: 'privacy.section2.content' },
  { icon: Globe, titleKey: 'privacy.section3.title', contentKey: 'privacy.section3.content' },
  { icon: Shield, titleKey: 'privacy.section4.title', contentKey: 'privacy.section4.content' },
  { icon: FileLock, titleKey: 'privacy.section5.title', contentKey: 'privacy.section5.content' },
  { icon: Lock, titleKey: 'privacy.section6.title', contentKey: 'privacy.section6.content' },
  { icon: Mail, titleKey: 'privacy.section7.title', contentKey: 'privacy.section7.content' },
];

export default function Privacy() {
  const t = useT();

  useSEO({
    title: t('privacy.seoTitle'),
    description: t('privacy.seoDesc'),
    keywords: t('privacy.seoKeywords'),
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': t('privacy.seoTitle'),
        'description': t('privacy.seoDesc'),
        'url': 'https://ppic.cc/privacy',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {t('privacy.title')}
            </h1>
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              {t('privacy.lastUpdated')}
            </p>
          </div>

          <div className="card p-6 sm:p-8 mb-8">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('privacy.intro')}
            </p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.titleKey} className="card p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        {t(section.titleKey)}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {t(section.contentKey)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('privacy.footerNote')}
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
