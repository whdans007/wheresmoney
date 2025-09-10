import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Card,
  Title,
  List,
  Button,
  Divider
} from 'react-native-paper';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';

export default function HelpScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const openEmail = () => {
    const subject = t('help.version') + ' ' + t('help.contact');
    Linking.openURL(`mailto:whdans0077@gmail.com?subject=${encodeURIComponent(subject)}`);
  };

  const openWebsite = () => {
    Linking.openURL('https://wheresmoney.app');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      {/* 앱 소개 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>
            {t('help.welcome')}
          </Title>
          <Text style={[styles.description, { color: themeColors.text.secondary }]}>
            {t('help.description')}
          </Text>
        </Card.Content>
      </Card>

      {/* 주요 기능 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {t('help.mainFeatures')}
          </Title>
          
          <List.Item
            title={t('help.features.familyRoom.title')}
            description={t('help.features.familyRoom.description')}
            left={(props) => <List.Icon {...props} icon="home-group" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title={t('help.features.expenseRecord.title')}
            description={t('help.features.expenseRecord.description')}
            left={(props) => <List.Icon {...props} icon="camera" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title={t('help.features.incomeRecord.title')}
            description={t('help.features.incomeRecord.description')}
            left={(props) => <List.Icon {...props} icon="cash-plus" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title={t('help.features.statistics.title')}
            description={t('help.features.statistics.description')}
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
          <Divider />
          
          <List.Item
            title={t('help.features.notifications.title')}
            description={t('help.features.notifications.description')}
            left={(props) => <List.Icon {...props} icon="bell" />}
            titleStyle={{ color: themeColors.text.primary }}
            descriptionStyle={{ color: themeColors.text.secondary }}
          />
        </Card.Content>
      </Card>

      {/* 사용 방법 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {t('help.howToUse')}
          </Title>
          
          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>1</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>{t('help.steps.step1.title')}</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                {t('help.steps.step1.description')}
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>2</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>{t('help.steps.step2.title')}</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                {t('help.steps.step2.description')}
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>3</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>{t('help.steps.step3.title')}</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                {t('help.steps.step3.description')}
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <Text style={[styles.stepNumber, { color: themeColors.primary[500] }]}>4</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>{t('help.steps.step4.title')}</Text>
              <Text style={[styles.stepDescription, { color: themeColors.text.secondary }]}>
                {t('help.steps.step4.description')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 팁 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {t('help.tips')}
          </Title>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • {t('help.tipsList.autoPhoto')}
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • {t('help.tipsList.notifications')}
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • {t('help.tipsList.settings')}
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
              • {t('help.tipsList.charts')}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* FAQ */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {t('help.faq')}
          </Title>
          
          <List.Accordion
            title={t('help.faqList.photoRequired.question')}
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 1}
            onPress={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                {t('help.faqList.photoRequired.answer')}
              </Text>
            </View>
          </List.Accordion>
          
          <List.Accordion
            title={t('help.faqList.leaveFamily.question')}
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 2}
            onPress={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                {t('help.faqList.leaveFamily.answer')}
              </Text>
            </View>
          </List.Accordion>
          
          <List.Accordion
            title={t('help.faqList.dataBackup.question')}
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 3}
            onPress={() => setExpandedFAQ(expandedFAQ === 3 ? null : 3)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                {t('help.faqList.dataBackup.answer')}
              </Text>
            </View>
          </List.Accordion>

          <List.Accordion
            title={t('help.faqList.categories.question')}
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 4}
            onPress={() => setExpandedFAQ(expandedFAQ === 4 ? null : 4)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                {t('help.faqList.categories.answer')}
              </Text>
            </View>
          </List.Accordion>

          <List.Accordion
            title={t('help.faqList.tooManyNotifications.question')}
            titleStyle={{ color: themeColors.text.primary, fontSize: 14 }}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            expanded={expandedFAQ === 5}
            onPress={() => setExpandedFAQ(expandedFAQ === 5 ? null : 5)}
          >
            <View style={styles.faqContent}>
              <Text style={[styles.faqAnswer, { color: themeColors.text.secondary }]}>
                {t('help.faqList.tooManyNotifications.answer')}
              </Text>
            </View>
          </List.Accordion>
        </Card.Content>
      </Card>

      {/* 연락처 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {t('help.contact')}
          </Title>
          <Text style={[styles.contactText, { color: themeColors.text.secondary }]}>
            {t('help.contactMessage')}
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              icon="email"
              onPress={openEmail}
              style={styles.contactButton}
            >
              {t('help.sendEmail')}
            </Button>
            
            <Button
              mode="outlined"
              icon="web"
              onPress={openWebsite}
              style={styles.contactButton}
            >
              {t('help.visitWebsite')}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 버전 정보 */}
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: themeColors.text.secondary }]}>
              {t('help.version')}
            </Text>
            <Text style={[styles.versionText, { color: themeColors.text.secondary }]}>
              {t('help.madeWithLove')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
    lineHeight: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipContainer: {
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  contactButton: {
    marginVertical: 4,
  },
  versionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  faqContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
});