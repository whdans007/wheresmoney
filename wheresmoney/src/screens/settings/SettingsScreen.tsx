import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card,
  Title,
  List,
  Switch,
  Button,
  Dialog,
  Portal,
  RadioButton,
  Divider
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types';
import { useSettingsStore, CURRENCIES, Currency, Language } from '../../stores/settingsStore';
import { colors, darkColors, spacing, textStyles } from '../../theme';

type SettingsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: Props) {
  const { 
    isDarkMode, 
    currency, 
    language, 
    toggleDarkMode, 
    setCurrency, 
    setLanguage 
  } = useSettingsStore();
  
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);

  const languages = [
    { code: 'ko' as Language, name: '한국어', nativeName: '한국어' },
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
  ];

  const handleCurrencySelect = (selectedCurrency: Currency) => {
    setCurrency(selectedCurrency);
    setShowCurrencyDialog(false);
    Alert.alert('설정 완료', `화폐 단위가 ${selectedCurrency.name}(으)로 변경되었습니다.`);
  };

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageDialog(false);
    const languageName = languages.find(l => l.code === selectedLanguage)?.name;
    Alert.alert('설정 완료', `언어가 ${languageName}(으)로 변경되었습니다.`);
  };

  const currentLanguage = languages.find(l => l.code === language);
  const themeColors = isDarkMode ? darkColors : colors;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>앱 설정</Title>
          
          <List.Section>
            <List.Item
              title="다크 모드"
              description={isDarkMode ? "어두운 테마 사용 중" : "밝은 테마 사용 중"}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="화폐 단위"
              description={`${currency.name} (${currency.symbol})`}
              left={(props) => <List.Icon {...props} icon="currency-usd" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCurrencyDialog(true)}
            />
            
            <Divider />
            
            <List.Item
              title="언어"
              description={currentLanguage?.nativeName || '한국어'}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowLanguageDialog(true)}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>정보</Title>
          
          <List.Section>
            <List.Item
              title="앱 버전"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <Divider />
            
            <List.Item
              title="개발자 정보"
              description="가족 가계부 앱"
              left={(props) => <List.Icon {...props} icon="code-tags" />}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* 화폐 단위 선택 다이얼로그 */}
      <Portal>
        <Dialog visible={showCurrencyDialog} onDismiss={() => setShowCurrencyDialog(false)}>
          <Dialog.Title>화폐 단위 선택</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                const selectedCurrency = CURRENCIES.find(c => c.code === value);
                if (selectedCurrency) {
                  handleCurrencySelect(selectedCurrency);
                }
              }}
              value={currency.code}
            >
              {CURRENCIES.map((curr) => (
                <RadioButton.Item
                  key={curr.code}
                  label={`${curr.name} (${curr.symbol})`}
                  value={curr.code}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCurrencyDialog(false)}>취소</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 언어 선택 다이얼로그 */}
      <Portal>
        <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
          <Dialog.Title>언어 선택</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                handleLanguageSelect(value as Language);
              }}
              value={language}
            >
              {languages.map((lang) => (
                <RadioButton.Item
                  key={lang.code}
                  label={lang.nativeName}
                  value={lang.code}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLanguageDialog(false)}>취소</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  card: {
    margin: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing[2],
    color: colors.text.primary,
  },
});