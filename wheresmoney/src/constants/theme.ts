import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Colors } from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryVariant,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryVariant,
    surface: Colors.surface,
    background: Colors.background,
    error: Colors.error,
    onPrimary: Colors.onPrimary,
    onSecondary: Colors.onSecondary,
    onSurface: Colors.onSurface,
    onBackground: Colors.onBackground,
    onError: Colors.onError,
  },
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryVariant,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryVariant,
    // Dark theme colors would be different
    surface: '#121212',
    background: '#000000',
    error: Colors.error,
  },
  roundness: 8,
};