import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  Paragraph,
  Divider,
  Checkbox,
  TextInput,
  HelperText
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';

type DeleteAccountScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'DeleteAccount'>;

interface Props {
  navigation: DeleteAccountScreenNavigationProp;
}

export default function DeleteAccountScreen({ navigation }: Props) {
  const { user, signOut } = useAuthStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [agreedToWarnings, setAgreedToWarnings] = useState(false);
  const [error, setError] = useState('');

  const requiredText = '회원탈퇴';
  const isConfirmValid = confirmText === requiredText && agreedToWarnings;

  const handleDeleteAccount = async () => {
    if (!isConfirmValid) {
      setError('모든 확인 사항을 완료해주세요.');
      return;
    }

    setIsDeleting(true);
    setError('');
    
    try {
      const { AuthService } = await import('../../services/auth');
      const result = await AuthService.deleteAccount();
      
      if (result.error) {
        Alert.alert('오류', `계정 삭제 중 오류가 발생했습니다: ${result.error}`);
        setError(result.error);
      } else {
        Alert.alert('완료', '계정이 성공적으로 삭제되었습니다.');
        // Auth state will be cleared in AuthService.deleteAccount()
      }
    } catch (error) {
      Alert.alert('오류', '계정 삭제 중 오류가 발생했습니다.');
      console.log('Delete account error:', error);
      setError('계정 삭제 중 오류가 발생했습니다.');
    }
    setIsDeleting(false);
  };

  const showFinalConfirmation = () => {
    Alert.alert(
      '최종 확인',
      '정말로 계정을 탈퇴하시겠습니까?\n\n개인정보는 삭제되지만, 작성한 가계부 데이터는 가족 구성원들을 위해 익명으로 보존됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴', style: 'destructive', onPress: handleDeleteAccount }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.warningCard, { backgroundColor: '#E8F5E8' }]}>
        <Card.Content>
          <Title style={[styles.warningTitle, { color: '#2E7D32' }]}>ℹ️ 데이터 보존 정책</Title>
          <Text style={[styles.warningText, { color: '#2E7D32' }]}>
            탈퇴 시 개인정보는 삭제되지만, 가계부 데이터는 가족 구성원들을 위해 익명으로 보존됩니다.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>회원 탈퇴</Title>
          
          <Text style={[styles.userInfo, { color: themeColors.text.primary }]}>
            탈퇴할 계정: {user?.nickname} ({user?.email})
          </Text>

          <Divider style={styles.divider} />

          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>탈퇴 시 삭제되는 데이터</Title>
          
          <View style={styles.dataList}>
            <Text style={[styles.dataItem, { color: themeColors.text.secondary }]}>• 개인 프로필 정보 (닉네임, 이메일 등)</Text>
            <Text style={[styles.dataItem, { color: themeColors.text.secondary }]}>• 계정 로그인 정보</Text>
            <Text style={[styles.dataItem, { color: themeColors.text.secondary }]}>• 가족방 멤버십</Text>
          </View>

          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>보존되는 데이터</Title>
          
          <View style={styles.dataList}>
            <Text style={[styles.dataItem, { color: themeColors.success }]}>• 작성한 가계부 내역 (익명 처리)</Text>
            <Text style={[styles.dataItem, { color: themeColors.success }]}>• 업로드한 사진</Text>
            <Text style={[styles.dataItem, { color: themeColors.success }]}>• 가족 구성원들의 기록 보존</Text>
          </View>

          <Divider style={styles.divider} />

          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>가족방 처리 방식</Title>
          
          <View style={styles.dataList}>
            <Text style={[styles.dataItem, { color: themeColors.text.secondary }]}>
              • 소유한 가족방이 있다면 다른 멤버에게 소유권이 자동 이전됩니다
            </Text>
            <Text style={[styles.dataItem, { color: themeColors.text.secondary }]}>
              • 다른 멤버가 없는 가족방은 완전히 삭제됩니다
            </Text>
            <Text style={[styles.dataItem, { color: themeColors.text.secondary }]}>
              • 다른 가족방의 멤버인 경우 해당 가족방에서 자동 탈퇴됩니다
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.confirmationSection}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={agreedToWarnings ? 'checked' : 'unchecked'}
                onPress={() => setAgreedToWarnings(!agreedToWarnings)}
                color={themeColors.primary[500]}
              />
              <Text style={[styles.checkboxText, { color: themeColors.text.primary }]}>
                위 내용을 모두 확인했으며, 계정 탈퇴에 동의합니다.
              </Text>
            </View>

            <TextInput
              label={`확인을 위해 "${requiredText}"를 입력해주세요`}
              value={confirmText}
              onChangeText={setConfirmText}
              style={styles.confirmInput}
              error={confirmText.length > 0 && confirmText !== requiredText}
            />
            
            {confirmText.length > 0 && confirmText !== requiredText && (
              <HelperText type="error">
                정확히 "{requiredText}"를 입력해주세요.
              </HelperText>
            )}
          </View>

          {error ? (
            <HelperText type="error" visible={true} style={styles.errorText}>
              {error}
            </HelperText>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={[styles.cancelButton, { borderColor: themeColors.text.secondary }]}
              textColor={themeColors.text.secondary}
              disabled={isDeleting}
            >
              취소
            </Button>
            
            <Button
              mode="contained"
              onPress={showFinalConfirmation}
              loading={isDeleting}
              disabled={!isConfirmValid || isDeleting}
              style={styles.deleteButton}
              buttonColor="#D32F2F"
              textColor="white"
            >
              {isDeleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  divider: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dataList: {
    marginLeft: 8,
  },
  dataItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  confirmationSection: {
    marginTop: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    marginTop: 2,
  },
  confirmInput: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});