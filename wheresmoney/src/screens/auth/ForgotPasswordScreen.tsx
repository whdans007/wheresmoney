import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { AuthService } = await import('../../services/auth');
      const { error } = await AuthService.resetPassword(email);
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setSuccess(true);
    } catch (err: any) {
      setError('비밀번호 재설정에 실패했습니다.');
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return email.includes('@');
  };

  if (success) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>이메일 전송 완료</Title>
            <Text style={styles.successText}>
              {email}로 비밀번호 재설정 링크를 보냈습니다.
              {'\n\n'}
              이메일을 확인하여 비밀번호를 재설정하세요.
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              {t('auth.backToLogin')}
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>비밀번호 찾기</Title>
          <Text style={styles.subtitle}>
            가입한 이메일 주소를 입력하면{'\n'}
            비밀번호 재설정 링크를 보내드립니다.
          </Text>

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

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={loading}
            disabled={!email || !isValidEmail(email)}
            style={styles.button}
          >
            {t('auth.sendResetLink')}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            {t('auth.backToLogin')}
          </Button>
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
    lineHeight: 20,
  },
  successText: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#4CAF50',
    lineHeight: 20,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 8,
  },
});