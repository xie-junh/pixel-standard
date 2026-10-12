import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationSchema } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationSchema;
  getRatioName: (key: string, defaultName?: string) => string;
  getRatioUsage: (key: string, defaultUsage?: string) => string;
  getCategoryName: (category: string) => string;
}

const STORAGE_KEY = 'pixelstandard_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') {
        return saved;
      }
      // If browser language is English, default to English, else Chinese
      if (navigator.language && navigator.language.toLowerCase().startsWith('en')) {
        return 'en';
      }
    } catch {
      // Fallback
    }
    return 'zh';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    } catch {
      // Ignore
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'zh' ? 'en' : 'zh'));
  };

  const t = translations[language];

  const getRatioName = (key: string, defaultName?: string): string => {
    const localized = t.ratios[key as keyof typeof t.ratios];
    if (localized) return localized;
    return defaultName || key;
  };

  const getRatioUsage = (key: string, defaultUsage?: string): string => {
    const localized = t.ratioUsages[key as keyof typeof t.ratioUsages];
    if (localized) return localized;
    return defaultUsage || '';
  };

  const getCategoryName = (category: string): string => {
    const localized = t.categories[category as keyof typeof t.categories];
    if (localized) return localized;
    return category;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getRatioName,
        getRatioUsage,
        getCategoryName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
