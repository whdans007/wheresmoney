import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  // 푸시 알림 권한 요청 및 토큰 등록
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('실제 디바이스에서만 푸시 알림이 작동합니다.');
        return null;
      }

      // 권한 확인
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 권한이 없으면 요청
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
        return null;
      }

      // 푸시 토큰 가져오기
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
      });

      console.log('푸시 토큰:', token.data);

      // Android 알림 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('푸시 알림 등록 오류:', error);
      return null;
    }
  }

  // 사용자 푸시 토큰 저장
  static async savePushToken(userId: string, pushToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: pushToken,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('푸시 토큰 저장 오류:', error);
      }
    } catch (error) {
      console.error('푸시 토큰 저장 예외:', error);
    }
  }

  // 로컬 알림 표시 (테스트용)
  static async showLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        trigger: null, // 즉시 표시
      });
    } catch (error) {
      console.error('로컬 알림 표시 오류:', error);
    }
  }

  // 가족 구성원들에게 푸시 알림 전송 (서버 함수 호출)
  static async sendFamilyNotification(
    familyId: string,
    senderUserId: string,
    notification: NotificationData
  ): Promise<void> {
    console.log('sendFamilyNotification 호출됨:', { familyId, senderUserId, notification });
    
    try {
      // Supabase Edge Function 호출 (실제로는 서버에서 구현해야 함)
      console.log('Supabase Edge Function 호출 시도...');
      const { data, error } = await supabase.functions.invoke('send-family-notification', {
        body: {
          familyId,
          senderUserId,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
      });

      console.log('Edge Function 응답:', { data, error });

      if (error) {
        console.error('가족 알림 전송 오류:', error);
        console.log('Edge Function 실패, 로컬 알림으로 대체...');
        await this.showLocalNotification(notification);
      } else {
        console.log('Edge Function 호출 성공');
      }
    } catch (error) {
      console.error('가족 알림 전송 예외:', error);
      console.log('Edge Function이 없어서 로컬 알림으로 테스트...');
      // 서버 함수가 없을 경우 로컬 알림으로 테스트
      await this.showLocalNotification(notification);
    }
  }

  // 가계부 기록 알림
  static async notifyLedgerEntry(
    familyId: string,
    senderUserId: string,
    senderName: string,
    amount: number,
    isIncome: boolean
  ): Promise<void> {
    console.log('NotificationService.notifyLedgerEntry 호출됨:', {
      familyId,
      senderUserId,
      senderName,
      amount,
      isIncome
    });
    
    const type = isIncome ? '수입' : '지출';
    const formattedAmount = Math.abs(amount).toLocaleString();
    
    const notification = {
      title: '새로운 가계부 기록',
      body: `${senderName}님이 ${type} ${formattedAmount}원을 등록했습니다.`,
      data: {
        type: 'ledger_entry',
        familyId,
        senderUserId,
        amount,
      },
    };
    
    console.log('전송할 알림 내용:', notification);
    
    await this.sendFamilyNotification(familyId, senderUserId, notification);
  }

  // 가족 초대 알림
  static async notifyFamilyInvite(
    invitedUserId: string,
    familyName: string,
    inviterName: string
  ): Promise<void> {
    // 개별 사용자에게 직접 알림 (구현 필요)
    console.log(`가족 초대 알림: ${inviterName}님이 ${familyName}에 초대했습니다.`);
  }

  // 멤버 가입 알림
  static async notifyMemberJoin(
    familyId: string,
    newMemberUserId: string,
    newMemberName: string
  ): Promise<void> {
    await this.sendFamilyNotification(familyId, newMemberUserId, {
      title: '새 멤버 가입',
      body: `${newMemberName}님이 가족방에 참여했습니다.`,
      data: {
        type: 'member_join',
        familyId,
        newMemberUserId,
      },
    });
  }

  // 사용자의 알림 설정 확인
  static async checkNotificationSettings(
    userId: string,
    notificationType: 'ledger_entries' | 'family_invites' | 'member_joins'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select(notificationType)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // 설정이 없으면 기본값 true 반환
        return true;
      }

      return data[notificationType] ?? true;
    } catch (error) {
      console.error('알림 설정 확인 오류:', error);
      return true; // 오류 시 기본값 true
    }
  }
}

export default NotificationService;