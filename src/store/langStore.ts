import { create } from 'zustand';
import type { Lang } from '../i18n/translations';
import { getLangFromNavigator } from '../i18n/translations';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: (localStorage.getItem('ppic_lang') as Lang) || getLangFromNavigator(),
  setLang: (lang: Lang) => {
    localStorage.setItem('ppic_lang', lang);
    set({ lang });
  },
}));
