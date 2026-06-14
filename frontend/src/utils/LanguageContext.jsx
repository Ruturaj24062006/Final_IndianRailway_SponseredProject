import React, { createContext, useContext, useState } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';

const translations = { en, hi, mr };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLocale(lang);
      localStorage.setItem('app_language', lang);
      
      try {
        const selectEl = document.querySelector('.goog-te-combo');
        if (selectEl) {
          selectEl.value = lang;
          selectEl.dispatchEvent(new Event('change'));
        }
      } catch (err) {
        console.warn("Google Translate programmatic change failed:", err);
      }
    }
  };

  React.useEffect(() => {
    const savedLang = localStorage.getItem('app_language') || 'en';
    if (savedLang !== 'en') {
      const interval = setInterval(() => {
        const selectEl = document.querySelector('.goog-te-combo');
        if (selectEl) {
          selectEl.value = savedLang;
          selectEl.dispatchEvent(new Event('change'));
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
