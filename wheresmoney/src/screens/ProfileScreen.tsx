import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  Avatar,
  List,
  Dialog,
  Portal,
  Paragraph
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { useAuthStore } from '../stores/authStore';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuthStore();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { AuthService } = await import('../services/auth');
      const result = await AuthService.deleteAccount();
      
      if (result.error) {
        Alert.alert('오류', `계정 삭제 중 오류가 발생했습니다: ${result.error}`);
      } else {
        Alert.alert('완료', '계정이 성공적으로 삭제되었습니다.');
        // Auth state will be cleared in AuthService.deleteAccount()
      }
    } catch (error) {
      Alert.alert('오류', '계정 삭제 중 오류가 발생했습니다.');
      console.log('Delete account error:', error);
    }
    setIsDeleting(false);
    setDeleteDialogVisible(false);
  };

  const showDeleteConfirmation = () => {
    setDeleteDialogVisible(true);
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
              navigation.navigate('EditProfile');
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

      <Button
        mode="outlined"
        onPress={showDeleteConfirmation}
        style={styles.deleteButton}
        textColor="#D32F2F"
      >
        회원 탈퇴
      </Button>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>회원 탈퇴</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              정말로 회원 탈퇴하시겠습니까?
            </Paragraph>
            <Paragraph style={styles.warningText}>
              • 탈퇴 시 모든 데이터가 삭제됩니다{'\n'}
              • 소유한 가족방이 있다면 다른 멤버에게 소유권이 이전됩니다{'\n'}
              • 다른 멤버가 없는 가족방은 완전히 삭제됩니다{'\n'}
              • 이 작업은 되돌릴 수 없습니다
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>취소</Button>
            <Button 
              onPress={handleDeleteAccount}
              loading={isDeleting}
              disabled={isDeleting}
              textColor="#D32F2F"
            >
              {isDeleting ? '삭제 중...' : '탈퇴'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  deleteButton: {
    marginTop: 10,
    borderColor: '#D32F2F',
  },
  warningText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 10,
  },
});