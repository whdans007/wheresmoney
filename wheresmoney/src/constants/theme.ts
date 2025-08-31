import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors as Colors } from '../theme/colors';

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
    primary: Colors.primary[400],
    primaryContainer: Colors.primary[800],
    secondary: Colors.secondary[400],
    secondaryContainer: Colors.secondary[800],
    surface: Colors.background.dark,
    background: '#000000',
    error: Colors.error,
  },
  roundness: 8,
};