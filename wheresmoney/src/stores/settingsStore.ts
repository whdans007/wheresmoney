import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from '../i18n';

// Get system language
const getSystemLanguage = (): Language => {
  try {
    let locale = '';
    
    if (Platform.OS === 'web') {
      locale = navigator.language || navigator.languages?.[0] || 'ko-KR';
    } else {
      locale = Localization.locale || 'ko-KR';
    }
    
    const lang = locale.toLowerCase().split('-')[0];
    
    if (lang === 'en') return 'en';
    if (lang === 'ko') return 'ko';
    
    return 'en'; // Default to English for other languages
  } catch (error) {
    console.log('Error getting system language:', error);
    return 'ko'; // Korean as fallback
  }
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'KRW', symbol: '원', name: '한국 원화' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
];

export type Language = 'ko' | 'en';

interface SettingsState {
  isDarkMode: boolean;
  currency: Currency;
  language: Language;
  
  // Actions
  toggleDarkMode: () => void;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      currency: CURRENCIES[0], // KRW as default
      language: getSystemLanguage(), // Use system language as default
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);