import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Share, Dimensions, Clipboard } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  TextInput,
  Appbar,
  ActivityIndicator,
  Paragraph
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
// import QRCode from 'react-native-qrcode-svg'; // 임시 비활성화
import { HomeStackParamList } from '../../types';
import { FamilyMembersService } from '../../services/familyMembers';

type InviteScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Invite'>;
type InviteScreenRouteProp = RouteProp<HomeStackParamList, 'Invite'>;

interface Props {
  navigation: InviteScreenNavigationProp;
  route: InviteScreenRouteProp;
}

export default function InviteScreen({ navigation, route }: Props) {
  const { familyId } = route.params;
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const generateInviteCode = async () => {
    setIsGenerating(true);
    try {
      console.log('Generating invite code for family:', familyId);
      const result = await FamilyMembersService.createInviteCode(familyId);
      console.log('Invite code result:', result);
      
      if (result.error) {
        console.log('Error generating invite code:', result.error);
        console.error('Full error result:', result);
        setInviteCode(null);
        Alert.alert('오류', `초대 코드 생성에 실패했습니다: ${result.error}`);
        return; // 에러 시 early return
      }
      
      if (result.success && result.code) {
        console.log('Successfully generated invite code:', result.code);
        setInviteCode(result.code);
        setExpiresAt(result.expiresAt || null);
      } else {
        console.log('No code returned despite success');
        console.error('Full result object:', result);
        setInviteCode(null);
        setExpiresAt(null);
        Alert.alert('오류', '초대 코드 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Generate invite code error:', error);
      setInviteCode(null);
      setExpiresAt(null);
      Alert.alert('오류', '초대 코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setHasLoaded(true);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      Clipboard.setString(inviteCode);
      Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다.');
    }
  };

  const formatExpiresAt = (expiresAtString: string): string => {
    const expiresDate = new Date(expiresAtString);
    const now = new Date();
    const diffMs = expiresDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs <= 0) {
      return '만료됨';
    }
    
    return `${diffHours}시간 ${diffMinutes}분 후 만료`;
  };

  const shareInviteCode = async () => {
    if (!inviteCode) return;
    
    try {
      await Share.share({
        message: `가족방에 초대합니다!\n\n초대 코드: ${inviteCode}\n\nWhere's My Money 앱에서 이 코드를 입력하여 가족방에 참여하세요.`,
        title: '가족방 초대',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const joinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert('오류', '초대 코드를 입력해주세요.');
      return;
    }

    setIsJoining(true);
    try {
      const result = await FamilyMembersService.joinFamilyByCode(joinCode.trim());
      
      if (result.error) {
        Alert.alert('오류', `가족방 참여에 실패했습니다: ${result.error}`);
      } else {
        Alert.alert(
          '성공', 
          '가족방에 성공적으로 참여했습니다!',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.log('Join family error:', error);
      Alert.alert('오류', '가족방 참여 중 오류가 발생했습니다.');
    }
    setIsJoining(false);
  };

  useEffect(() => {
    console.log('InviteScreen mounted with familyId:', familyId);
    console.log('Route params:', route.params);
    
    if (!familyId) {
      console.error('No familyId provided');
      Alert.alert('오류', '가족방 정보가 없습니다.');
      setHasLoaded(true);
      return;
    }
    
    generateInviteCode();
  }, [familyId]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="가족방 초대" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              가족방 초대하기
            </Text>
            <Paragraph style={styles.description}>
              QR 코드를 스캔하거나 초대 코드를 공유하여 가족을 초대하세요.
            </Paragraph>

            {!hasLoaded || isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>초대 코드 생성 중...</Text>
              </View>
            ) : inviteCode !== null && inviteCode !== '' ? (
              <View style={styles.inviteContainer}>
                <View style={styles.qrContainer}>
                  <Text style={styles.qrPlaceholder}>
                    QR 코드 자리{'\n'}(임시로 비활성화됨)
                  </Text>
                </View>
                
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText}>초대 코드: {inviteCode}</Text>
                  <Button
                    mode="outlined"
                    onPress={copyInviteCode}
                    icon="content-copy"
                    compact
                    style={styles.copyButton}
                  >
                    복사
                  </Button>
                </View>
                
                {expiresAt && (
                  <Text style={styles.expiresText}>
                    {formatExpiresAt(expiresAt)}
                  </Text>
                )}
                
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={shareInviteCode}
                    style={styles.shareButton}
                    icon="share"
                  >
                    초대 코드 공유
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={generateInviteCode}
                    loading={isGenerating}
                  >
                    새 코드 생성
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  초대 코드 생성에 실패했습니다.{'\n'}
                  콘솔에서 자세한 오류를 확인하세요.
                </Text>
                <Button mode="outlined" onPress={generateInviteCode}>
                  다시 시도
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              가족방 참여하기
            </Text>
            <Paragraph style={styles.description}>
              받은 초대 코드를 입력하여 가족방에 참여하세요.
            </Paragraph>

            <TextInput
              label="초대 코드"
              value={joinCode}
              onChangeText={setJoinCode}
              mode="outlined"
              placeholder="6자리 숫자를 입력하세요"
              style={styles.input}
              keyboardType="numeric"
              maxLength={6}
            />

            <Button
              mode="contained"
              onPress={joinFamily}
              loading={isJoining}
              disabled={isJoining || !joinCode.trim()}
              style={styles.joinButton}
            >
              가족방 참여
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  inviteContainer: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  codeText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    color: '#2196F3',
  },
  copyButton: {
    borderColor: '#2196F3',
  },
  expiresText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 8,
  },
  shareButton: {
    marginBottom: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  joinButton: {
    // No additional styles needed
  },
});