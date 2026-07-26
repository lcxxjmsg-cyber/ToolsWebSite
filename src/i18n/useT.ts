import { useLangStore } from '../store/langStore';
import { t } from './translations';

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: string) => t(lang, key);
}

export function useLang() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return { lang, setLang };
}
