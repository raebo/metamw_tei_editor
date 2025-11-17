import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import common_en from './locales/en/common.json';
import editor_dialog_en from './locales/en/editor/dialog.json';
import errors_en from './locales/en/errors.json';

import common_de from './locales/de/common.json';
import editor_dialog_de from './locales/de/editor/dialog.json';
import errors_de from './locales/de/errors.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: common_en,
        errors: errors_en,
        editor: {
          dialog: editor_dialog_en,
        },
      },
      de: {
        common: common_de,
        errors: errors_de,
        editor: {
          dialog: editor_dialog_de,
        },
      },
    },
    fallbackLng: 'en',
    ns: ['common', 'errors', 'editor'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export const changeLanguage = (lng: 'en' | 'de') => {
  i18n.changeLanguage(lng);
};

export default i18n;
