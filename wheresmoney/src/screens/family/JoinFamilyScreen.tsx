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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [joinCode, setJoinCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const { setFamilies } = useFamilyStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;

  const joinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert(t('common.error'), t('family.join.errors.enterInviteCode'));
      return;
    }

    if (joinCode.trim().length !== 6) {
      Alert.alert(t('common.error'), t('family.join.errors.inviteCodeFormat'));
      return;
    }

    setIsJoining(true);
    try {
      const result = await FamilyMembersService.joinFamilyByCode(joinCode.trim());
      
      console.log('Join family result:', result);
      
      if (!result.success || result.error) {
        console.error('Join family error:', result.error);
        Alert.alert(t('family.join.errors.joinFailed'), result.error || t('family.join.errors.joinFailedMessage'));
      } else if (!result.familyId) {
        console.error('Join successful but no familyId provided');
        Alert.alert(t('common.error'), t('family.join.errors.cannotLoadFamily'));
      } else {
        // 가족 목록을 다시 로드하여 store 업데이트
        try {
          const familiesResult = await FamilyService.getUserFamilies();
          if (familiesResult.families) {
            setFamilies(familiesResult.families);
          }
        } catch (error) {
          console.error('Family list update failed:', error);
        }

        Alert.alert(
          t('family.join.success.joinComplete'), 
          t('family.join.success.joinSuccessMessage'),
          [
            {
              text: t('common.confirm'),
              onPress: () => navigation.navigate('FamilyDetail', { familyId: result.familyId })
            }
          ]
        );
      }
    } catch (error) {
      console.log('Join family error:', error);
      Alert.alert(t('common.error'), t('family.join.errors.errorDuringJoin'));
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
        <Appbar.Content title={t('family.join.title')} />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
            </View>
            
            <Text style={[styles.title, { color: themeColors.text.primary }]}>
              {t('family.join.heading')}
            </Text>
            
            <Text style={[styles.description, { color: themeColors.text.secondary }]}>
              {t('family.join.instructions')}
            </Text>

            <TextInput
              label={t('family.join.inviteCode')}
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
              {isJoining ? t('family.join.joining') : t('family.join.joinButton')}
            </Button>

            <View style={[styles.helpContainer, { backgroundColor: themeColors.background.tertiary }]}>
              <Text style={[styles.helpText, { color: themeColors.text.secondary }]}>
                {t('family.join.helpText')}
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
    paddingTop: spacing[8], // Position content higher on screen
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
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: spacing[3],
    minHeight: 32,
    includeFontPadding: false,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
    paddingHorizontal: spacing[2],
    minHeight: 48,
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
    minHeight: 40,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
});