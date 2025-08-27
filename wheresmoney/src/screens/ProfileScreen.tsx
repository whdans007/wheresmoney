import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  Avatar,
  List
} from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

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
    <View style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={user?.nickname?.charAt(0) || 'U'} 
            style={styles.avatar}
          />
          <Title style={styles.nickname}>{user?.nickname || '사용자'}</Title>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.menuCard}>
        <Card.Content>
          <List.Item
            title="프로필 수정"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to edit profile
            }}
          />
          <List.Item
            title="알림 설정"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to notification settings
            }}
          />
          <List.Item
            title="도움말"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to help
            }}
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
    backgroundColor: '#f5f5f5',
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
    color: '#666',
  },
  menuCard: {
    marginBottom: 20,
  },
  signOutButton: {
    marginTop: 'auto',
    borderColor: '#B00020',
  },
});