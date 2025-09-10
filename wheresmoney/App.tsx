import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme, darkTheme } from './src/constants/theme';
import { AuthService } from './src/services/auth';
import { useAuthStore } from './src/stores/authStore';
import { useSettingsStore } from './src/stores/settingsStore';
import './src/i18n';

export default function App() {
  // Web-only version for testing
  if (Platform.OS === 'web') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        color: '#333'
      }}>
        <h1>Where's Money 우리집가계부</h1>
        <p>웹 버전은 현재 개발 중입니다.</p>
        <p>Web version is currently under development.</p>
        <p>모바일 앱을 사용해 주세요.</p>
        <p>Please use the mobile app.</p>
      </div>
    );
  }

  const { user, loading, setLoading } = useAuthStore();
  const { isDarkMode, language } = useSettingsStore();
  const { t, i18n } = useTranslation();

  // Sync i18n language with settings store
  useEffect(() => {
    if (i18n.language !== language) {
      console.log('Syncing language from store:', language);
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const result = await AuthService.getCurrentUser();
        console.log('Initial auth check result:', result);
        if (!result.user) {
          setLoading(false);
        }
        // 사용자가 있으면 onAuthStateChange에서 setLoading(false) 호출
      } catch (error) {
        console.log('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { supabase } = require('./src/services/supabase');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('User signed in or token refreshed');
          try {
            await AuthService.getCurrentUser();
          } catch (error) {
            console.error('Error getting current user:', error);
          } finally {
            setLoading(false); // 무조건 로딩 해제
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          useAuthStore.getState().setUser(null);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 16 }}>{t('common.loading')}</Text>
            </View>
            <StatusBar style={isDarkMode ? 'light' : 'auto'} />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
          <AppNavigator />
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
