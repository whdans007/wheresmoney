import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme } from './src/constants/theme';
import { AuthService } from './src/services/auth';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { user, loading, setLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      setLoading(true);
      try {
        await AuthService.getCurrentUser();
      } catch (error) {
        console.log('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { supabase } = require('./src/services/supabase');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') {
          await AuthService.getCurrentUser();
        } else if (event === 'SIGNED_OUT') {
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
          <PaperProvider theme={lightTheme}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 16 }}>Loading...</Text>
            </View>
            <StatusBar style="auto" />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={lightTheme}>
          <AppNavigator />
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
