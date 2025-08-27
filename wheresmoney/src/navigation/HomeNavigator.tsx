import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';

// Import screens (will create these)
import HomeScreen from '../screens/home/HomeScreen';
import CreateFamilyScreen from '../screens/family/CreateFamilyScreen';
import JoinFamilyScreen from '../screens/family/JoinFamilyScreen';
import FamilyDetailScreen from '../screens/family/FamilyDetailScreen';
import AddLedgerEntryScreen from '../screens/ledger/AddLedgerEntryScreen';
import LedgerDetailScreen from '../screens/ledger/LedgerDetailScreen';
import InviteScreen from '../screens/family/InviteScreen';
import StatsScreen from '../screens/stats/StatsScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{ title: '가족 가계부' }}
      />
      <Stack.Screen 
        name="CreateFamily" 
        component={CreateFamilyScreen}
        options={{ title: '가족방 만들기' }}
      />
      <Stack.Screen 
        name="JoinFamily" 
        component={JoinFamilyScreen}
        options={{ title: '가족방 참여', headerShown: false }}
      />
      <Stack.Screen 
        name="FamilyDetail" 
        component={FamilyDetailScreen}
        options={{ title: '가족방' }}
      />
      <Stack.Screen 
        name="AddLedgerEntry" 
        component={AddLedgerEntryScreen}
        options={{ title: '가계부 작성' }}
      />
      <Stack.Screen 
        name="LedgerDetail" 
        component={LedgerDetailScreen}
        options={{ title: '가계부 상세' }}
      />
      <Stack.Screen 
        name="Invite" 
        component={InviteScreen}
        options={{ title: '가족방 초대' }}
      />
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ title: '통계' }}
      />
    </Stack.Navigator>
  );
}