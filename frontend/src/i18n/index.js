import { createContext, useContext, useState, useCallback } from 'react';
import en from './en';
import fa from './fa';

const translations = { en, fa };
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('nameh_lang') || 'en');

  const switchLang = useCallback((l) => {
    setLang(l);
    localStorage.setItem('nameh_lang', l);
    document.documentElement.dir = l === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, switchLang, t, isRtl: lang === 'fa' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
