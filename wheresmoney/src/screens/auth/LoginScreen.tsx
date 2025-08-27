import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { AuthService } = await import('../../services/auth');
      const { user, error } = await AuthService.signIn(email, password);
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      
      if (user) {
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
            로그인
          </Button>

          <View style={styles.linkContainer}>
            <Button
              mode="text"
              onPress={() => navigation.navigate('SignUp')}
            >
              회원가입
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              비밀번호 찾기
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