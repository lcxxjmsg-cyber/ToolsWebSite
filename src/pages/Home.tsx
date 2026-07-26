import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Shuffle,
  Zap,
  Crop,
  Shield,
  Users,
  InfinityIcon,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SUPPORTED_INPUT_FORMATS } from '../types/index';
import { useSEO, InjectJSONLD } from '../utils/seo';
import { useT } from '../i18n/useT';

const HOME_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  'name': '批图网',
  'url': 'https://ppic.cc/',
  'description': '永久免费在线图片批量处理工具箱。纯本地处理不上传服务器，支持20+图片处理功能。批量压缩、格式转换、裁剪、滤镜、水印，保护您的隐私安全。',
  'applicationCategory': 'MultimediaApplication',
  'operatingSystem': 'All',
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'CNY',
  },
  'featureList': [
    '图片格式转换 (PNG, JPEG, WebP, AVIF, GIF, BMP, ICO, TIFF)',
    '图片压缩 (有损/无损/目标大小)',
    '图片裁剪 (自由比例/预设比例)',
    '调整尺寸 (百分比/像素/适应)',
    '滤镜特效 (亮度/对比度/饱和度等9种)',
    '水印添加 (文字/图片)',
    '边框添加',
    '批量处理',
    'ZIP压缩包导入导出',
  ],
};

export default function Home() {
  const navigate = useNavigate();
  const t = useT();

  useSEO({
    title: t('home.seoTitle'),
    description: t('home.seoDesc'),
    keywords: t('home.seoKeywords'),
  });

  const FEATURES = [
    {
      icon: Shuffle,
      title: t('home.feature1.title'),
      description: t('home.feature1.desc'),
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      icon: Zap,
      title: t('home.feature2.title'),
      description: t('home.feature2.desc'),
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      icon: Crop,
      title: t('home.feature3.title'),
      description: t('home.feature3.desc'),
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      icon: Sparkles,
      title: t('home.feature4.title'),
      description: t('home.feature4.desc'),
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      iconColor: 'text-rose-500',
    },
  ];

  const TRUST_BADGES = [
    { icon: Check, label: t('home.badge1') },
    { icon: Shield, label: t('home.badge2') },
    { icon: Users, label: t('home.badge3') },
    { icon: Layers, label: t('home.badge4') },
    { icon: InfinityIcon, label: t('home.badge5') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f]">
      <InjectJSONLD data={HOME_JSONLD} />
      <Header />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 dark:from-brand-500/5 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                {t('home.title')}
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/workspace')}
                className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2 group"
              >
                {t('home.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/workspace')}
                className="btn-secondary text-base px-8 py-4"
              >
                {t('home.feature1.title')}
              </button>
            </div>
          </div>
        </section>

        {/* Format Badges */}
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-5">
              支持的输入格式
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {SUPPORTED_INPUT_FORMATS.map((fmt) => (
                <span
                  key={fmt}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
                >
                  {fmt.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white mb-14">
              强大功能，一站搞定
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    onClick={() => navigate('/workspace')}
                    className="card p-6 sm:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5`}
                    >
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 bg-white dark:bg-[#0f0f0f] border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  <Icon className="w-4 h-4 text-emerald-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
