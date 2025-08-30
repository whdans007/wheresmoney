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
import { FamilyService } from '../../services/family';

type InviteScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Invite'>;
type InviteScreenRouteProp = RouteProp<HomeStackParamList, 'Invite'>;

interface Props {
  navigation: InviteScreenNavigationProp;
  route: InviteScreenRouteProp;
}

export default function InviteScreen({ navigation, route }: Props) {
  const { familyId } = route.params;
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [familyName, setFamilyName] = useState<string>('');
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  const loadFamilyInfo = async () => {
    setIsLoading(true);
    try {
      console.log('Loading family info for family:', familyId);
      
      // 가족방 정보와 초대 코드 동시 로드
      const [inviteResult, familyResult] = await Promise.all([
        FamilyService.getFamilyInviteCode(familyId),
        FamilyService.getFamilyDetails(familyId)
      ]);
      
      console.log('Invite code result:', inviteResult);
      console.log('Family details result:', familyResult);
      
      // 가족방 이름 설정
      if (familyResult.family?.name) {
        setFamilyName(familyResult.family.name);
      }
      
      // 초대 코드 설정
      if (inviteResult.error) {
        console.log('Error loading invite code:', inviteResult.error);
        setInviteCode(null);
        Alert.alert('오류', `초대 코드 조회에 실패했습니다: ${inviteResult.error}`);
        return;
      }
      
      if (inviteResult.inviteCode) {
        console.log('Successfully loaded invite code:', inviteResult.inviteCode);
        setInviteCode(inviteResult.inviteCode);
      } else {
        console.log('No invite code returned');
        setInviteCode(null);
        Alert.alert('오류', '초대 코드를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Load family info error:', error);
      setInviteCode(null);
      Alert.alert('오류', '가족방 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  const generateNewInviteCode = async () => {
    setIsGeneratingNew(true);
    try {
      console.log('Generating new invite code for family:', familyId);
      
      // 사용자에게 확인 받기
      Alert.alert(
        '새 초대 코드 생성',
        `${familyName} 가족방의 새로운 초대 코드를 생성하시겠습니까?\n\n⚠️ 기존 코드는 더 이상 사용할 수 없게 됩니다.`,
        [
          {
            text: '취소',
            style: 'cancel'
          },
          {
            text: '생성',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await FamilyService.generateNewInviteCode(familyId);
                
                if (result.error) {
                  console.error('New invite code generation failed:', result.error);
                  Alert.alert('오류', `새 초대 코드 생성에 실패했습니다: ${result.error}`);
                } else if (result.inviteCode) {
                  console.log('New invite code generated:', result.inviteCode);
                  setInviteCode(result.inviteCode);
                  Alert.alert(
                    '성공',
                    `새로운 초대 코드가 생성되었습니다!\n\n새 코드: ${result.inviteCode}`,
                    [{ text: '확인' }]
                  );
                }
              } catch (error) {
                console.error('Generate new code error:', error);
                Alert.alert('오류', '새 초대 코드 생성 중 오류가 발생했습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Generate new invite code error:', error);
      Alert.alert('오류', '새 초대 코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingNew(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      Clipboard.setString(inviteCode);
      Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다.');
    }
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
    console.log('=== joinFamily function called ===');
    console.log('Current joinCode:', joinCode);
    console.log('joinCode trimmed:', joinCode.trim());
    console.log('joinCode length:', joinCode.trim().length);
    
    if (!joinCode.trim()) {
      console.log('Empty join code, showing alert');
      Alert.alert('오류', '초대 코드를 입력해주세요.');
      return;
    }

    console.log('Setting isJoining to true');
    setIsJoining(true);
    
    try {
      console.log('=== Starting join process ===');
      console.log('Calling FamilyMembersService.joinFamilyByCode with code:', joinCode.trim());
      
      const result = await FamilyMembersService.joinFamilyByCode(joinCode.trim());
      console.log('=== Join result received ===');
      console.log('Full result:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.log('=== Join failed ===');
        console.log('Error message:', result.error);
        console.log('Family name:', result.familyName);
        
        const errorMessage = result.familyName 
          ? `${result.familyName} 가족방 참여에 실패했습니다: ${result.error}`
          : `가족방 참여에 실패했습니다: ${result.error}`;
        
        console.log('Showing error alert:', errorMessage);
        Alert.alert('오류', errorMessage);
      } else if (result.success) {
        console.log('=== Join successful ===');
        console.log('Family ID:', result.familyId);
        console.log('Family name:', result.familyName);
        
        const successMessage = result.familyName
          ? `${result.familyName} 가족방에 성공적으로 참여했습니다!`
          : '가족방에 성공적으로 참여했습니다!';
        
        console.log('Showing success alert:', successMessage);
        Alert.alert(
          '성공', 
          successMessage,
          [
            {
              text: '확인',
              onPress: () => {
                console.log('Success alert confirmed, navigating back');
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        console.log('=== Unexpected result ===');
        console.log('Result has no error but success is not true');
        Alert.alert('오류', '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('=== Join family exception ===');
      console.error('Exception details:', error);
      console.error('Exception stack:', error.stack);
      Alert.alert('오류', '가족방 참여 중 오류가 발생했습니다.');
    } finally {
      console.log('=== Finally block ===');
      console.log('Setting isJoining to false');
      setIsJoining(false);
    }
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
    
    loadFamilyInfo();
  }, [familyId]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={familyName ? `${familyName} 초대` : "가족방 초대"} />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {familyName ? `${familyName} 가족방 초대하기` : '가족방 초대하기'}
            </Text>
            <Paragraph style={styles.description}>
              {familyName 
                ? `${familyName} 가족방의 초대 코드를 공유하여 새 멤버를 초대하세요.`
                : '초대 코드를 공유하여 가족을 초대하세요.'
              } 이 코드는 가족방이 삭제될 때까지 유효합니다.
            </Paragraph>

            {!hasLoaded || isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>초대 코드 불러오는 중...</Text>
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
                
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={shareInviteCode}
                    style={styles.shareButton}
                    icon="share"
                  >
                    초대 코드 공유
                  </Button>
                  <View style={styles.secondaryButtons}>
                    <Button
                      mode="outlined"
                      onPress={loadFamilyInfo}
                      loading={isLoading}
                      style={styles.secondaryButton}
                      icon="refresh"
                    >
                      새로고침
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={generateNewInviteCode}
                      loading={isGeneratingNew}
                      style={[styles.secondaryButton, styles.generateButton]}
                      icon="shuffle-variant"
                    >
                      새 코드 생성
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  초대 코드를 불러올 수 없습니다.{'\n'}
                  가족방 소유자만 초대 코드를 볼 수 있습니다.
                </Text>
                <Button mode="outlined" onPress={loadFamilyInfo}>
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
              onPress={() => {
                console.log('=== Join button clicked ===');
                console.log('isJoining:', isJoining);
                console.log('joinCode:', joinCode);
                console.log('joinCode.trim():', joinCode.trim());
                console.log('Button disabled:', isJoining || !joinCode.trim());
                joinFamily();
              }}
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
  secondaryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
  },
  generateButton: {
    borderColor: '#FF6B6B',
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