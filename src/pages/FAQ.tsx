import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useT } from '../i18n/useT';
import { useSEO, InjectJSONLD } from '../utils/seo';

const FAQ_ITEMS = [
  { qKey: 'faq.q1', aKey: 'faq.a1' },
  { qKey: 'faq.q2', aKey: 'faq.a2' },
  { qKey: 'faq.q3', aKey: 'faq.a3' },
  { qKey: 'faq.q4', aKey: 'faq.a4' },
  { qKey: 'faq.q5', aKey: 'faq.a5' },
  { qKey: 'faq.q6', aKey: 'faq.a6' },
  { qKey: 'faq.q7', aKey: 'faq.a7' },
  { qKey: 'faq.q8', aKey: 'faq.a8' },
  { qKey: 'faq.q9', aKey: 'faq.a9' },
  { qKey: 'faq.q10', aKey: 'faq.a10' },
];

export default function FAQ() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useSEO({
    title: t('faq.seoTitle'),
    description: t('faq.seoDesc'),
    keywords: t('faq.seoKeywords'),
  });

  const faqJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      'name': t(item.qKey),
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': t(item.aKey),
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
          <section className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 text-brand-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {t('faq.title')}
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              {t('faq.subtitle')}
            </p>
          </section>

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
                      {t(item.qKey)}
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
                        <p>{t(item.aKey)}</p>
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
