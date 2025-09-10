import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    { code: 'ko' as Language, name: t('language.korean'), nativeName: t('language.korean') },
    { code: 'en' as Language, name: t('language.english'), nativeName: t('language.english') },
  ];

  const handleCurrencySelect = (selectedCurrency: Currency) => {
    setCurrency(selectedCurrency);
    setShowCurrencyDialog(false);
    Alert.alert(t('common.settingsComplete'), t('settings.currencyChanged', { currency: t(`currency.${selectedCurrency.code.toLowerCase()}`) }));
  };

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageDialog(false);
    const languageName = languages.find(l => l.code === selectedLanguage)?.name;
    Alert.alert(t('common.settingsComplete'), t('settings.languageChanged', { language: languageName }));
  };

  const currentLanguage = languages.find(l => l.code === language);
  const themeColors = isDarkMode ? darkColors : colors;

  const openDeveloperEmail = () => {
    Linking.openURL('mailto:whdans0077@gmail.com?subject=Where\'s Money 우리집가계부 문의');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>{t('settings.appSettings')}</Title>
          
          <List.Section>
            <List.Item
              title={t('settings.darkMode')}
              description={isDarkMode ? t('settings.darkThemeActive') : t('settings.lightThemeActive')}
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
              title={t('settings.currency')}
              description={`${t(`currency.${currency.code.toLowerCase()}`)} (${currency.symbol})`}
              left={(props) => <List.Icon {...props} icon="currency-usd" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCurrencyDialog(true)}
            />
            
            <Divider />
            
            <List.Item
              title={t('settings.language')}
              description={currentLanguage?.nativeName || t('language.korean')}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowLanguageDialog(true)}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>{t('settings.information')}</Title>
          
          <List.Section>
            <List.Item
              title={t('settings.appVersion')}
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <Divider />
            
            <List.Item
              title={t('settings.developerInfo')}
              description="필사랑 (philsarang) - whdans0077@gmail.com"
              left={(props) => <List.Icon {...props} icon="code-tags" />}
              right={(props) => <List.Icon {...props} icon="email" />}
              onPress={openDeveloperEmail}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Currency Selection Dialog */}
      <Portal>
        <Dialog visible={showCurrencyDialog} onDismiss={() => setShowCurrencyDialog(false)}>
          <Dialog.Title>{t('settings.selectCurrency')}</Dialog.Title>
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
                  label={`${t(`currency.${curr.code.toLowerCase()}`)} (${curr.symbol})`}
                  value={curr.code}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCurrencyDialog(false)}>{t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Language Selection Dialog */}
      <Portal>
        <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
          <Dialog.Title>{t('settings.selectLanguage')}</Dialog.Title>
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
            <Button onPress={() => setShowLanguageDialog(false)}>{t('common.cancel')}</Button>
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
    fontSize: 20,
    fontWeight: '600',
    minHeight: 24, // 텍스트 최소 높이 보장
    lineHeight: 24, // 명시적 lineHeight 설정
    textAlignVertical: 'center', // Android에서 수직 중앙 정렬
    includeFontPadding: false, // Android에서 폰트 패딩 제거
    paddingVertical: 3, // 수직 패딩 추가
    marginBottom: spacing[2],
    color: colors.text.primary,
  },
});