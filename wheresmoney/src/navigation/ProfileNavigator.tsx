import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import { ProfileStackParamList } from '../types';

import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import DeleteAccountScreen from '../screens/profile/DeleteAccountScreen';
import NotificationScreen from '../screens/profile/NotificationScreen';
import HelpScreen from '../screens/profile/HelpScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isDarkMode } = useSettingsStore();

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.card,
      borderBottomColor: isDarkMode ? '#333333' : '#e6e6e6',
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: {
      color: theme.colors.text,
    },
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        options={{ title: t('navigation.profile') }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: t('navigation.editProfile') }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: t('navigation.settings') }}
      />
      <Stack.Screen 
        name="DeleteAccount" 
        component={DeleteAccountScreen}
        options={{ title: t('navigation.deleteAccount') }}
      />
      <Stack.Screen 
        name="Notification" 
        component={NotificationScreen}
        options={{ title: t('navigation.notification') }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ title: t('navigation.help') }}
      />
    </Stack.Navigator>
  );
}