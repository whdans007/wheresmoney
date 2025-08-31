import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  TextInput,
  Appbar,
  Paragraph
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';
import { FamilyMembersService } from '../../services/familyMembers';
import { FamilyService } from '../../services/family';
import { useFamilyStore } from '../../stores/familyStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors, spacing, shadows, textStyles } from '../../theme';

type JoinFamilyScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'JoinFamily'>;

interface Props {
  navigation: JoinFamilyScreenNavigationProp;
}

export default function JoinFamilyScreen({ navigation }: Props) {
  const [joinCode, setJoinCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const { setFamilies } = useFamilyStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;

  const joinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert('오류', '초대 코드를 입력해주세요.');
      return;
    }

    if (joinCode.trim().length !== 6) {
      Alert.alert('오류', '초대 코드는 6자리 숫자여야 합니다.');
      return;
    }

    setIsJoining(true);
    try {
      const result = await FamilyMembersService.joinFamilyByCode(joinCode.trim());
      
      console.log('Join family result:', result);
      
      if (!result.success || result.error) {
        console.error('Join family error:', result.error);
        Alert.alert('참여 실패', result.error || '가족방 참여에 실패했습니다.');
      } else if (!result.familyId) {
        console.error('Join successful but no familyId provided');
        Alert.alert('오류', '가족방 정보를 불러올 수 없습니다.');
      } else {
        // 가족 목록을 다시 로드하여 store 업데이트
        try {
          const familiesResult = await FamilyService.getUserFamilies();
          if (familiesResult.families) {
            setFamilies(familiesResult.families);
          }
        } catch (error) {
          console.error('가족 목록 업데이트 실패:', error);
        }

        Alert.alert(
          '참여 완료! 🎉', 
          '가족방에 성공적으로 참여했습니다!\n가족 구성원을 확인해보세요.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('FamilyDetail', { familyId: result.familyId })
            }
          ]
        );
      }
    } catch (error) {
      console.log('Join family error:', error);
      Alert.alert('오류', '가족방 참여 중 오류가 발생했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeChange = (text: string) => {
    // 숫자만 입력 허용
    const numericText = text.replace(/[^0-9]/g, '');
    setJoinCode(numericText);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Appbar.Header style={[styles.header, { backgroundColor: themeColors.surface.primary }]}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="가족방 참여" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
            </View>
            
            <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text.primary }]}>
              가족방 참여하기
            </Text>
            
            <Paragraph style={[styles.description, { color: themeColors.text.secondary }]}>
              가족이 공유해준 6자리 초대 코드를 입력하여{'\n'}
              가족방에 참여하세요.
            </Paragraph>

            <TextInput
              label="초대 코드"
              value={joinCode}
              onChangeText={handleCodeChange}
              mode="outlined"
              placeholder="123456"
              style={styles.input}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              textAlign="center"
              contentStyle={styles.inputContent}
            />

            <Button
              mode="contained"
              onPress={joinFamily}
              loading={isJoining}
              disabled={isJoining || joinCode.length !== 6}
              style={styles.joinButton}
              contentStyle={styles.joinButtonContent}
              buttonColor={themeColors.primary[500]}
            >
              {isJoining ? '참여 중...' : '가족방 참여하기'}
            </Button>

            <View style={[styles.helpContainer, { backgroundColor: themeColors.background.tertiary }]}>
              <Text style={[styles.helpText, { color: themeColors.text.secondary }]}>
                💡 초대 코드는 가족방 소유자가 생성할 수 있습니다
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...shadows.small,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    ...shadows.medium,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...textStyles.h2,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    ...textStyles.body1,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  input: {
    marginBottom: spacing[5],
  },
  inputContent: {
    ...textStyles.h3,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  joinButton: {
    borderRadius: spacing[4],
    marginBottom: spacing[4],
  },
  joinButtonContent: {
    height: 48,
  },
  helpContainer: {
    padding: spacing[3],
    borderRadius: spacing[3],
    alignItems: 'center',
  },
  helpText: {
    ...textStyles.caption,
    textAlign: 'center',
  },
});