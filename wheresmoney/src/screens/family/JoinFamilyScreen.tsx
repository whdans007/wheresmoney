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
import { colors, spacing, shadows, textStyles } from '../../theme';

type JoinFamilyScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'JoinFamily'>;

interface Props {
  navigation: JoinFamilyScreenNavigationProp;
}

export default function JoinFamilyScreen({ navigation }: Props) {
  const [joinCode, setJoinCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);

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
      
      if (result.error) {
        console.error('Join family error:', result.error);
        Alert.alert('참여 실패', `${result.error}\n\n디버그 정보:\n- 입력 코드: ${joinCode}\n- 응답: ${JSON.stringify(result)}`);
      } else {
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
    }
    setIsJoining(false);
  };

  const handleCodeChange = (text: string) => {
    // 숫자만 입력 허용
    const numericText = text.replace(/[^0-9]/g, '');
    setJoinCode(numericText);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="가족방 참여" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
            </View>
            
            <Text variant="headlineSmall" style={styles.title}>
              가족방 참여하기
            </Text>
            
            <Paragraph style={styles.description}>
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
              buttonColor={colors.primary[500]}
            >
              {isJoining ? '참여 중...' : '가족방 참여하기'}
            </Button>

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
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
    backgroundColor: colors.background.secondary,
  },
  header: {
    backgroundColor: colors.surface.primary,
    ...shadows.small,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface.primary,
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
    color: colors.text.primary,
  },
  description: {
    ...textStyles.body1,
    textAlign: 'center',
    marginBottom: spacing[6],
    color: colors.text.secondary,
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
    backgroundColor: colors.background.tertiary,
    padding: spacing[3],
    borderRadius: spacing[3],
    alignItems: 'center',
  },
  helpText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});