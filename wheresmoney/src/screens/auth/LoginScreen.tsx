import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  TextInput, 
  Button, 
  Title, 
  Text, 
  Card,
  HelperText
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleResendConfirmation = async (userEmail: string) => {
    try {
      const { AuthService } = await import('../../services/auth');
      
      // 먼저 일반 재발송 시도
      let result = await AuthService.resendConfirmationEmail(userEmail);
      
      if (result.error) {
        // 일반 재발송 실패 시 강제 재발송 시도
        Alert.alert(
          '재발송 실패',
          '일반 재발송이 실패했습니다. 강제 재발송을 시도하시겠습니까?',
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('auth.resend.forceResend'), 
              onPress: async () => {
                const forceResult = await AuthService.forceResendEmail(userEmail);
                if (forceResult.error) {
                  Alert.alert('오류', forceResult.error);
                } else {
                  Alert.alert('완료', forceResult.message);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('완료', result.message);
      }
    } catch (error) {
      Alert.alert('오류', '이메일 재발송에 실패했습니다.');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { AuthService } = await import('../../services/auth');
      const result = await AuthService.signIn(email, password);
      
      // 이메일 인증이 필요한 경우
      if (result.needsConfirmation) {
        setError('');
        Alert.alert(
          '이메일 인증 필요',
          result.message || '이메일 인증이 필요합니다.',
          [
            {
              text: t('auth.resend.resendEmail'),
              onPress: () => handleResendConfirmation(result.unconfirmedEmail || email),
            },
            {
              text: t('common.confirm'),
              style: 'default',
            },
          ]
        );
        setLoading(false);
        return;
      }
      
      if (result.error) {
        // 다른 에러 처리
        if (result.error.includes('email not confirmed') || result.error.includes('Email not confirmed')) {
          setError('이메일 인증이 완료되지 않았습니다.\n받은편지함을 확인하여 계정을 인증해주세요.');
        } else {
          setError(result.error);
        }
        setLoading(false);
        return;
      }
      
      if (result.user) {
        // 인증 성공 - App.tsx에서 자동으로 Main Navigator로 이동
        setLoading(false);
      }
    } catch (err: any) {
      setError('로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return email.includes('@');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>가족 가계부</Title>
          <Text style={styles.subtitle}>로그인하여 시작하세요</Text>

          <TextInput
            label="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            error={!isValidEmail(email) && email.length > 0}
          />
          <HelperText type="error" visible={!isValidEmail(email) && email.length > 0}>
            올바른 이메일 주소를 입력하세요
          </HelperText>

          <TextInput
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password || !isValidEmail(email)}
            style={styles.button}
          >
            {t('auth.login')}
          </Button>

          <View style={styles.linkContainer}>
            <Button
              mode="text"
              onPress={() => navigation.navigate('SignUp')}
            >
              {t('auth.signUp')}
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              {t('auth.forgotPassword')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});