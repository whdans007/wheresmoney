import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  Avatar,
  List
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { colors, darkColors } from '../theme';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuthStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;

  const handleSignOut = async () => {
    try {
      const { AuthService } = await import('../services/auth');
      await AuthService.signOut();
    } catch (error) {
      console.log('Sign out error:', error);
      // Fallback to local signOut
      signOut();
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.profileCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content style={styles.profileContent}>
          {user?.avatar_url ? (
            <Avatar.Image 
              size={80} 
              source={{ uri: user.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text 
              size={80} 
              label={user?.nickname?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
          )}
          <Title style={[styles.nickname, { color: themeColors.text.primary }]}>{user?.nickname || '사용자'}</Title>
          <Text style={[styles.email, { color: themeColors.text.secondary }]}>{user?.email || 'user@example.com'}</Text>
        </Card.Content>
      </Card>

      <Card style={[styles.menuCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <List.Item
            title="프로필 수정"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              navigation.navigate('EditProfile');
            }}
          />
          <List.Item
            title="설정"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              navigation.navigate('Settings');
            }}
          />
          <List.Item
            title="알림 설정"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // 알림 설정 기능은 향후 구현 예정
            }}
          />
          <List.Item
            title="도움말"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // 도움말 기능은 향후 구현 예정
            }}
          />
          <List.Item
            title="회원 탈퇴"
            left={(props) => <List.Icon {...props} icon="account-remove" color="#D32F2F" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              navigation.navigate('DeleteAccount');
            }}
            titleStyle={{ color: '#D32F2F' }}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.signOutButton}
        textColor="#B00020"
      >
        로그아웃
      </Button>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  nickname: {
    marginBottom: 4,
    fontSize: 24,
  },
  email: {
  },
  menuCard: {
    marginBottom: 20,
  },
  signOutButton: {
    marginTop: 'auto',
    borderColor: '#B00020',
  },
});