import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';

import ko from './ko.json';
import en from './en.json';

// Get system locale safely for both web and native
const getDeviceLocale = () => {
  if (Platform.OS === 'web') {
    // Web fallback using navigator
    return navigator.language || navigator.languages?.[0] || 'ko-KR';
  } else {
    // Native platforms using expo-localization
    try {
      return Localization.locale || 'ko-KR';
    } catch (error) {
      console.log('Error getting device locale:', error);
      return 'ko-KR';
    }
  }
};

const resources = {
  ko: { translation: ko },
  en: { translation: en },
};

// Parse locale to get language code
const parseLocaleToLanguage = (locale: string): string => {
  if (!locale) return 'ko';
  
  // Handle common locale formats (ko-KR, en-US, etc.)
  const lang = locale.toLowerCase().split('-')[0];
  
  // Support Korean and English, default to Korean
  if (lang === 'en') return 'en';
  if (lang === 'ko') return 'ko';
  
  // For other languages, default to English
  return 'en';
};

// Get language from async storage or use system locale
const getStoredLanguage = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const storedSettings = await AsyncStorage.getItem('settings-storage');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      if (settings.state?.language) {
        console.log('Using stored language:', settings.state.language);
        return settings.state.language;
      }
    }
  } catch (error) {
    console.log('Error getting stored language:', error);
  }
  
  // Use system locale if no stored preference
  const systemLocale = getDeviceLocale();
  const detectedLanguage = parseLocaleToLanguage(systemLocale);
  console.log('System locale:', systemLocale, '-> Language:', detectedLanguage);
  
  return detectedLanguage;
};

const initI18n = async () => {
  const language = await getStoredLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'ko',
      
      interpolation: {
        escapeValue: false,
      },
      
      compatibilityJSON: 'v3',
    });
};

initI18n();

export default i18n;