import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Title,
  Switch,
  List,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { supabase } from '../../services/supabase';
import { colors, darkColors } from '../../theme';

interface NotificationSettings {
  ledger_entries: boolean;
  family_invites: boolean;
  member_joins: boolean;
}

export default function NotificationScreen() {
  const { user } = useAuthStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    ledger_entries: true,
    family_invites: true,
    member_joins: true,
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('알림 설정 로드 오류:', error);
        return;
      }

      if (data) {
        setSettings({
          ledger_entries: data.ledger_entries ?? true,
          family_invites: data.family_invites ?? true,
          member_joins: data.member_joins ?? true,
        });
      }
    } catch (error) {
      console.error('알림 설정 로드 예외:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (
    setting: keyof NotificationSettings,
    value: boolean
  ) => {
    if (!user) return;

    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);

    try {
      // 먼저 기존 설정이 있는지 확인
      const { data: existingSettings, error: selectError } = await supabase
        .from('user_notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('기존 설정 확인 오류:', selectError);
        setSettings(settings);
        return;
      }

      if (existingSettings) {
        // 업데이트
        const { error } = await supabase
          .from('user_notification_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('알림 설정 업데이트 오류:', error);
          setSettings(settings);
        }
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('user_notification_settings')
          .insert({
            user_id: user.id,
            ...newSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('알림 설정 생성 오류:', error);
          setSettings(settings);
        }
      }
    } catch (error) {
      console.error('알림 설정 저장 예외:', error);
      setSettings(settings);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background.secondary }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>
          알림 설정 로딩 중...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>
            알림 설정
          </Title>
          <Text style={[styles.description, { color: themeColors.text.secondary }]}>
            받고 싶은 알림을 선택하세요
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <List.Item
            title="가계부 기록 알림"
            description="가족 구성원이 새로운 가계부를 등록했을 때"
            left={(props) => <List.Icon {...props} icon="receipt" />}
            right={() => (
              <Switch
                value={settings.ledger_entries}
                onValueChange={(value) => updateNotificationSetting('ledger_entries', value)}
              />
            )}
          />
          <Divider />
          <List.Item
            title="가족 초대 알림"
            description="새로운 가족방에 초대받았을 때"
            left={(props) => <List.Icon {...props} icon="account-plus" />}
            right={() => (
              <Switch
                value={settings.family_invites}
                onValueChange={(value) => updateNotificationSetting('family_invites', value)}
              />
            )}
          />
          <Divider />
          <List.Item
            title="멤버 가입 알림"
            description="새로운 멤버가 가족방에 참여했을 때"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            right={() => (
              <Switch
                value={settings.member_joins}
                onValueChange={(value) => updateNotificationSetting('member_joins', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.infoCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Text style={[styles.infoTitle, { color: themeColors.text.primary }]}>
            알림 정보
          </Text>
          <Text style={[styles.infoText, { color: themeColors.text.secondary }]}>
            • 알림은 앱을 사용하지 않을 때만 전송됩니다{'\n'}
            • 설정 변경은 즉시 적용됩니다{'\n'}
            • 중요한 시스템 알림은 항상 전송됩니다
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    margin: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});