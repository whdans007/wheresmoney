import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import { HomeStackParamList } from '../types';

// Import screens (will create these)
import HomeScreen from '../screens/home/HomeScreen';
import CreateFamilyScreen from '../screens/family/CreateFamilyScreen';
import JoinFamilyScreen from '../screens/family/JoinFamilyScreen';
import FamilyDetailScreen from '../screens/family/FamilyDetailScreen';
import AddLedgerEntryScreen from '../screens/ledger/AddLedgerEntryScreen';
import AddIncomeEntryScreen from '../screens/ledger/AddIncomeEntryScreen';
import AddEntryScreen from '../screens/ledger/AddEntryScreen';
import LedgerDetailScreen from '../screens/ledger/LedgerDetailScreen';
import InviteScreen from '../screens/family/InviteScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import MemberStatsScreen from '../screens/stats/MemberStatsScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
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
        name="HomeScreen" 
        component={HomeScreen}
        options={{ title: t('navigation.familyLedger') }}
      />
      <Stack.Screen 
        name="CreateFamily" 
        component={CreateFamilyScreen}
        options={{ title: t('navigation.createFamily') }}
      />
      <Stack.Screen 
        name="JoinFamily" 
        component={JoinFamilyScreen}
        options={{ title: t('navigation.joinFamily'), headerShown: false }}
      />
      <Stack.Screen 
        name="FamilyDetail" 
        component={FamilyDetailScreen}
        options={{ title: t('navigation.familyDetail') }}
      />
      <Stack.Screen 
        name="AddLedgerEntry" 
        component={AddLedgerEntryScreen}
        options={{ title: t('navigation.addEntry') }}
      />
      <Stack.Screen 
        name="AddIncomeEntry" 
        component={AddIncomeEntryScreen}
        options={{ title: t('navigation.addIncome') }}
      />
      <Stack.Screen 
        name="AddEntry" 
        component={AddEntryScreen}
        options={{ title: t('navigation.addEntry') }}
      />
      <Stack.Screen 
        name="LedgerDetail" 
        component={LedgerDetailScreen}
        options={{ title: t('navigation.ledgerDetail') }}
      />
      <Stack.Screen 
        name="Invite" 
        component={InviteScreen}
        options={{ title: t('navigation.invite') }}
      />
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ title: t('navigation.stats') }}
      />
      <Stack.Screen 
        name="MemberStats" 
        component={MemberStatsScreen}
        options={({ route }) => ({ title: t('navigation.memberStats', { memberName: route.params.memberName }) })}
      />
    </Stack.Navigator>
  );
}