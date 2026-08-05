import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Image, Upload } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { useSEO } from '../../utils/seo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ImageBase64Tool() {
  const t = useT();

  useSEO({
    title: '图片转Base64 - 批图网 | 在线图片转Base64编码工具',
    description: '免费在线图片转Base64编码工具，支持PNG/JPEG/WebP/GIF等格式，纯本地处理不上传服务器，保护您的隐私安全。',
    keywords: '图片转base64,base64图片,在线图片转码,图片编码',
  });
  const navigate = useNavigate();
  const [dataUrl, setDataUrl] = useState('');
  const [base64, setBase64] = useState('');
  const [format, setFormat] = useState('');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setBase64('');
    setFormat('');
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setDataUrl(url);
      setBase64(url.split(',')[1]);
      setFormat(file.type);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleCopy() {
    navigator.clipboard.writeText(base64).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />{t('nav.tools')}
        </button>
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('imagebase64.title')}</h1>
              <p className="text-sm text-slate-500">{t('imagebase64.subtitle')}</p>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500 dark:hover:border-violet-500 transition-colors"
          >
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{t('imagebase64.drop')}</p>
          </div>

          {dataUrl && (
            <div className="flex justify-center">
              <img src={dataUrl} alt="preview" className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-700" />
            </div>
          )}

          {base64 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('imagebase64.output')} ({format})
                </label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <textarea readOnly value={base64} rows={8}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] px-4 py-3 text-sm text-slate-900 dark:text-white font-mono resize-none select-all" />
              <p className="text-xs text-slate-400 mt-1">{base64.length} {t('imagebase64.chars')}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
