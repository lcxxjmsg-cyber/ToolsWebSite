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
import { useT } from '../i18n/useT';
import { useSEO, InjectJSONLD } from '../utils/seo';

const SECTIONS = [
  { icon: Gift, titleKey: 'terms.section1.title', contentKey: 'terms.section1.content' },
  { icon: AlertTriangle, titleKey: 'terms.section2.title', contentKey: 'terms.section2.content' },
  { icon: Ban, titleKey: 'terms.section3.title', contentKey: 'terms.section3.content' },
  { icon: BookOpen, titleKey: 'terms.section4.title', contentKey: 'terms.section4.content' },
  { icon: Clock, titleKey: 'terms.section5.title', contentKey: 'terms.section5.content' },
  { icon: FileText, titleKey: 'terms.section6.title', contentKey: 'terms.section6.content' },
];

export default function Terms() {
  const t = useT();

  useSEO({
    title: t('terms.seoTitle'),
    description: t('terms.seoDesc'),
    keywords: t('terms.seoKeywords'),
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': t('terms.seoTitle'),
        'description': t('terms.seoDesc'),
        'url': 'https://ppic.cc/terms',
      }} />
      <Header />

      <main className="pt-20 pb-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
              <Scale className="w-7 h-7 text-sky-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {t('terms.title')}
            </h1>
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              {t('terms.lastUpdated')}
            </p>
          </div>

          <div className="card p-6 sm:p-8 mb-8">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('terms.intro')}
            </p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.titleKey} className="card p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-sky-500" />
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

          <div className="mt-10 text-center space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('terms.footerNote1')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('terms.footerNote2')}
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
