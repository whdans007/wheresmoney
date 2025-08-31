import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors as Colors, darkColors } from '../theme/colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary[500],
    primaryContainer: Colors.primary[100],
    secondary: Colors.secondary[500],
    secondaryContainer: Colors.secondary[100],
    surface: Colors.surface.primary,
    background: Colors.background.primary,
    error: Colors.error,
    onPrimary: Colors.text.inverse,
    onSecondary: Colors.text.primary,
    onSurface: Colors.text.primary,
    onBackground: Colors.text.primary,
    onError: Colors.text.inverse,
  },
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary[400],
    primaryContainer: darkColors.primary[800],
    secondary: darkColors.secondary[400],
    secondaryContainer: darkColors.secondary[800],
    surface: darkColors.surface.primary,
    background: darkColors.background.primary,
    error: darkColors.error,
    onPrimary: darkColors.text.inverse,
    onSecondary: darkColors.text.primary,
    onSurface: darkColors.text.primary,
    onBackground: darkColors.text.primary,
    onError: darkColors.text.inverse,
  },
  roundness: 8,
};