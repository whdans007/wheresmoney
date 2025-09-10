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
import { useTranslation } from 'react-i18next';
// import QRCode from 'react-native-qrcode-svg'; // 임시 비활성화
import { HomeStackParamList } from '../../types';
import { FamilyMembersService } from '../../services/familyMembers';
import { FamilyService } from '../../services/family';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';

type InviteScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Invite'>;
type InviteScreenRouteProp = RouteProp<HomeStackParamList, 'Invite'>;

interface Props {
  navigation: InviteScreenNavigationProp;
  route: InviteScreenRouteProp;
}

export default function InviteScreen({ navigation, route }: Props) {
  const { familyId } = route.params;
  const { isDarkMode } = useSettingsStore();
  const { t } = useTranslation();
  const themeColors = isDarkMode ? darkColors : colors;
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
        Alert.alert(t('common.error'), t('family.invite.errors.loadInviteCodeFailed', { error: inviteResult.error }));
        return;
      }
      
      if (inviteResult.inviteCode) {
        console.log('Successfully loaded invite code:', inviteResult.inviteCode);
        setInviteCode(inviteResult.inviteCode);
      } else {
        console.log('No invite code returned');
        setInviteCode(null);
        Alert.alert(t('common.error'), t('family.invite.errors.noInviteCode'));
      }
    } catch (error) {
      console.error('Load family info error:', error);
      setInviteCode(null);
      Alert.alert(t('common.error'), t('family.invite.errors.loadFamilyInfoFailed'));
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
        t('family.invite.newCodeGeneration.title'),
        t('family.invite.newCodeGeneration.confirm', { familyName }),
        [
          {
            text: t('family.invite.newCodeGeneration.cancel'),
            style: 'cancel'
          },
          {
            text: t('family.invite.newCodeGeneration.generate'),
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await FamilyService.generateNewInviteCode(familyId);
                
                if (result.error) {
                  console.error('New invite code generation failed:', result.error);
                  Alert.alert(t('common.error'), t('family.invite.newCodeGeneration.failed', { error: result.error }));
                } else if (result.inviteCode) {
                  console.log('New invite code generated:', result.inviteCode);
                  setInviteCode(result.inviteCode);
                  Alert.alert(
                    t('family.invite.newCodeGeneration.success'),
                    t('family.invite.newCodeGeneration.successMessage', { code: result.inviteCode }),
                    [{ text: t('common.confirm') }]
                  );
                }
              } catch (error) {
                console.error('Generate new code error:', error);
                Alert.alert(t('common.error'), t('family.invite.newCodeGeneration.error'));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Generate new invite code error:', error);
      Alert.alert(t('common.error'), t('family.invite.newCodeGeneration.error'));
    } finally {
      setIsGeneratingNew(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      Clipboard.setString(inviteCode);
      Alert.alert(t('family.invite.copy.success'), t('family.invite.copy.message'));
    }
  };


  const shareInviteCode = async () => {
    if (!inviteCode) return;
    
    try {
      await Share.share({
        message: t('family.invite.share.message', { code: inviteCode }),
        title: t('family.invite.share.title'),
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
      Alert.alert(t('common.error'), t('family.invite.join.enterCode'));
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
          ? t('family.invite.join.failed', { familyName: result.familyName, error: result.error })
          : t('family.invite.join.failedGeneric', { error: result.error });
        
        console.log('Showing error alert:', errorMessage);
        Alert.alert(t('common.error'), errorMessage);
      } else if (result.success) {
        console.log('=== Join successful ===');
        console.log('Family ID:', result.familyId);
        console.log('Family name:', result.familyName);
        
        const successMessage = result.familyName
          ? t('family.invite.join.successMessage', { familyName: result.familyName })
          : t('family.invite.join.successMessageGeneric');
        
        console.log('Showing success alert:', successMessage);
        Alert.alert(
          t('family.invite.join.success'), 
          successMessage,
          [
            {
              text: t('common.confirm'),
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
        Alert.alert(t('common.error'), t('family.invite.join.unknownError'));
      }
    } catch (error) {
      console.error('=== Join family exception ===');
      console.error('Exception details:', error);
      console.error('Exception stack:', error.stack);
      Alert.alert(t('common.error'), t('family.invite.join.joinError'));
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
      Alert.alert(t('common.error'), t('family.invite.errors.noFamilyInfo'));
      setHasLoaded(true);
      return;
    }
    
    loadFamilyInfo();
  }, [familyId]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={familyName ? t('family.invite.title', { familyName }) : t('family.invite.title')} />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
              {t('family.invite.inviteToFamily')}
            </Text>
            <Paragraph style={[styles.description, { color: themeColors.text.secondary }]}>
              {familyName 
                ? t('family.invite.familyDescription', { familyName })
                : t('family.invite.description')
              }
            </Paragraph>

            {!hasLoaded || isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>{t('family.invite.loading')}</Text>
              </View>
            ) : inviteCode !== null && inviteCode !== '' ? (
              <View style={styles.inviteContainer}>
                <View style={styles.qrContainer}>
                  <Text style={[styles.qrPlaceholder, { color: themeColors.text.tertiary }]}>
                    {t('family.invite.qrPlaceholder')}
                  </Text>
                </View>
                
                <View style={styles.codeContainer}>
                  <Text style={[styles.codeText, { backgroundColor: themeColors.surface.secondary, color: themeColors.primary }]}>{t('family.invite.inviteCodeLabel', { code: inviteCode })}</Text>
                  <Button
                    mode="outlined"
                    onPress={copyInviteCode}
                    icon="content-copy"
                    compact
                    style={styles.copyButton}
                  >
                    {t('common.copy')}
                  </Button>
                </View>
                
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={shareInviteCode}
                    style={styles.shareButton}
                    icon="share"
                  >
                    {t('family.shareInviteCode')}
                  </Button>
                  <View style={styles.secondaryButtons}>
                    <Button
                      mode="outlined"
                      onPress={loadFamilyInfo}
                      loading={isLoading}
                      style={styles.secondaryButton}
                      icon="refresh"
                    >
                      {t('common.refresh')}
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={generateNewInviteCode}
                      loading={isGeneratingNew}
                      style={[styles.secondaryButton, styles.generateButton]}
                      icon="shuffle-variant"
                    >
                      {t('family.generateNewCode')}
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: themeColors.error.primary }]}>
                  {t('family.invite.errors.cannotLoadInviteCode')}
                </Text>
                <Button mode="outlined" onPress={loadFamilyInfo}>
                  {t('common.retry')}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
              {t('family.invite.joinFamily')}
            </Text>
            <Paragraph style={[styles.description, { color: themeColors.text.secondary }]}>
              {t('family.invite.joinDescription')}
            </Paragraph>

            <TextInput
              label={t('family.join.inviteCode')}
              value={joinCode}
              onChangeText={setJoinCode}
              mode="outlined"
              placeholder={t('family.invite.joinCodePlaceholder')}
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
              {t('family.joinFamily')}
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
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
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
    padding: 12,
    borderRadius: 8,
    flex: 1,
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