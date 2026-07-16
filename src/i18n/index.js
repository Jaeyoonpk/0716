import { createI18n } from 'vue-i18n';
import ko from './locales/ko.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';

export const SUPPORTED_LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' }
];

const savedLocale = localStorage.getItem('seoul-guide-locale');
const initialLocale = SUPPORTED_LOCALES.some((l) => l.code === savedLocale)
  ? savedLocale
  : 'ko';

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'ko',
  messages: { ko, en, fr, de, ja, zh, hi }
});