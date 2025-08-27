import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const { AuthService } = await import('../../services/auth');
      const { user, error } = await AuthService.signUp(email, password, nickname);
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      
      if (user) {
        // 회원가입 성공 - 이메일 확인 메시지 표시
        setError('');
        alert('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        navigation.goBack();
      }
      
      setLoading(false);
    } catch (err: any) {
      setError('회원가입에 실패했습니다.');
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return email.includes('@');
  };

  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>회원가입</Title>
          <Text style={styles.subtitle}>가족 가계부에 참여하세요</Text>

          <TextInput
            label="닉네임"
            value={nickname}
            onChangeText={setNickname}
            style={styles.input}
          />

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
            error={!isValidPassword(password) && password.length > 0}
          />
          <HelperText type="error" visible={!isValidPassword(password) && password.length > 0}>
            비밀번호는 6자 이상이어야 합니다
          </HelperText>

          <TextInput
            label="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            error={password !== confirmPassword && confirmPassword.length > 0}
          />
          <HelperText type="error" visible={password !== confirmPassword && confirmPassword.length > 0}>
            비밀번호가 일치하지 않습니다
          </HelperText>

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={
              !email || 
              !password || 
              !confirmPassword || 
              !nickname ||
              !isValidEmail(email) || 
              !isValidPassword(password) || 
              password !== confirmPassword
            }
            style={styles.button}
          >
            회원가입
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            이미 계정이 있나요? 로그인
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 20,
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
  backButton: {
    marginTop: 8,
  },
});