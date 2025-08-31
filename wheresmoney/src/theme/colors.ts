// Soft pastel color palette for gentle, calming UI
export const colors = {
  // Primary - Soft sky blue
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand - soft sky blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Secondary - Gentle mint green
  secondary: {
    50: '#f0fdf9',
    100: '#e6fffa',
    200: '#b3f5e8',
    300: '#7fecdb',
    400: '#4dd4c4',
    500: '#2dd4bf', // Soft teal/mint
    600: '#20b2a6',
    700: '#1a9085',
    800: '#176d6b',
    900: '#164e50',
  },

  // Accent - Warm peach/salmon
  accent: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ff9999', // Soft salmon pink
    600: '#f97316',
    700: '#ea580c',
    800: '#dc2626',
    900: '#b91c1c',
  },

  // Neutral - Soft warm grays
  neutral: {
    50: '#fefefe',
    100: '#fafafa',
    200: '#f0f0f0',
    300: '#e6e6e6',
    400: '#cccccc',
    500: '#a8a8a8',
    600: '#888888',
    700: '#6e6e6e',
    800: '#555555',
    900: '#3d3d3d',
  },

  // Status colors - Soft versions
  success: '#6ee7b7', // Soft green
  warning: '#fcd34d', // Soft yellow
  error: '#fca5a5',   // Soft red
  info: '#93c5fd',    // Soft blue

  // Background - Clean whites and soft grays
  background: {
    primary: '#fefefe',
    secondary: '#fafafa', // Clean light gray
    tertiary: '#f5f5f5',  // Soft gray
    dark: '#3d3d3d',
  },

  // Text - Clean but readable
  text: {
    primary: '#3d3d3d',   // Dark gray
    secondary: '#6e6e6e', // Medium gray
    tertiary: '#a8a8a8',  // Light gray
    inverse: '#fefefe',
    accent: '#ff9999',    // Soft salmon
  },

  // Surface - Clean elevated surfaces
  surface: {
    primary: '#fefefe',
    secondary: '#fafafa',
    elevated: '#ffffff',
    dark: '#3d3d3d',
  },

  // Border - Clean, subtle
  border: {
    light: '#f0f0f0',
    medium: '#e6e6e6',
    dark: '#cccccc',
  },
};

// Dark theme colors
export const darkColors = {
  ...colors,
  
  // Background - Dark theme
  background: {
    primary: '#121212',
    secondary: '#1e1e1e',
    tertiary: '#2d2d2d',
    dark: '#000000',
  },

  // Text - Dark theme
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    tertiary: '#999999',
    inverse: '#000000',
    accent: '#ff9999',
  },

  // Surface - Dark theme
  surface: {
    primary: '#1e1e1e',
    secondary: '#2d2d2d',
    elevated: '#333333',
    dark: '#121212',
  },

  // Border - Dark theme
  border: {
    light: '#333333',
    medium: '#444444',
    dark: '#555555',
  },

};

export const gradients = {
  primary: ['#0ea5e9', '#38bdf8', '#7dd3fc'],
  secondary: ['#2dd4bf', '#4dd4c4', '#7fecdb'],
  accent: ['#ff9999', '#fca5a5', '#fee2e2'],
  warm: ['#fcd34d', '#ff9999', '#fee2e2'],
  cool: ['#0ea5e9', '#7dd3fc', '#bae6fd'],
  fresh: ['#2dd4bf', '#6ee7b7', '#dcfce7'],
  sunset: ['#ff9999', '#fcd34d', '#fee2e2'],
};