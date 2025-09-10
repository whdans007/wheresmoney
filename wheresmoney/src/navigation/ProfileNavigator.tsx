import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useSettingsStore } from '../stores/settingsStore';
import { ProfileStackParamList } from '../types';

import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import DeleteAccountScreen from '../screens/profile/DeleteAccountScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
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
        options={{ title: '프로필' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: '프로필 편집' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: '설정' }}
      />
      <Stack.Screen 
        name="DeleteAccount" 
        component={DeleteAccountScreen}
        options={{ title: '회원 탈퇴' }}
      />
    </Stack.Navigator>
  );
}