import React, { createContext, useContext, ReactNode } from 'react';
import { colors, darkColors } from '../theme/colors';
import { useSettingsStore } from '../stores/settingsStore';

interface ThemeContextType {
  colors: typeof colors;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isDarkMode } = useSettingsStore();
  
  const themeColors = isDarkMode ? darkColors : colors;
  
  return (
    <ThemeContext.Provider value={{ colors: themeColors, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}