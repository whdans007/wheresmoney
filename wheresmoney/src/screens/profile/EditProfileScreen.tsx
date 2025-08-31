import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  Avatar,
  ActivityIndicator
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { supabase } from '../../services/supabase';
import { colors, darkColors } from '../../theme';

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setAvatar(user.avatar_url || null);
    }
  }, [user]);

  const validateInputs = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
    }

    if (newPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
      }
      if (newPassword.length < 6) {
        newErrors.newPassword = '새 비밀번호는 6자 이상이어야 합니다.';
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = '비밀번호 확인이 일치하지 않습니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permission.granted === false) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '프로필 사진',
      '프로필 사진을 어떻게 변경하시겠습니까?',
      [
        { text: '카메라', onPress: takePhoto },
        { text: '갤러리', onPress: pickImage },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  const uploadAvatar = async (imageUri: string): Promise<string | null> => {
    try {
      if (!user) return null;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const fileName = `${user.id}/avatar_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('아바타 업로드 오류:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('아바타 업로드 예외:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!validateInputs() || !user) return;

    setLoading(true);
    try {
      let avatarUrl = user.avatar_url;

      // 아바타 이미지가 변경된 경우
      if (avatar && avatar !== user.avatar_url) {
        console.log('아바타 업로드 중...');
        avatarUrl = await uploadAvatar(avatar);
        if (!avatarUrl) {
          Alert.alert('오류', '프로필 사진 업로드에 실패했습니다.');
          return;
        }
      }

      // 프로필 정보 업데이트
      const { error: profileError } = await supabase
        .from('users')
        .update({
          nickname: nickname.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('프로필 업데이트 오류:', profileError);
        Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
        return;
      }

      // 비밀번호 변경 (입력된 경우만)
      if (newPassword) {
        console.log('비밀번호 변경 중...');
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) {
          console.error('비밀번호 변경 오류:', passwordError);
          Alert.alert('오류', '비밀번호 변경에 실패했습니다.');
          return;
        }
      }

      // 로컬 사용자 정보 업데이트
      const updatedUser = {
        ...user,
        nickname: nickname.trim(),
        avatar_url: avatarUrl,
      };
      setUser(updatedUser);

      Alert.alert('성공', '프로필이 업데이트되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error('프로필 저장 예외:', error);
      Alert.alert('오류', '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>프로필 편집</Title>

          {/* 아바타 이미지 */}
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={100} label={nickname.charAt(0).toUpperCase()} />
            )}
            <Button
              mode="outlined"
              onPress={showImagePicker}
              style={styles.avatarButton}
              compact
            >
              사진 변경
            </Button>
          </View>

          {/* 이메일 (읽기 전용) */}
          <TextInput
            label="이메일"
            value={user?.email || ''}
            style={styles.input}
            editable={false}
            right={<TextInput.Icon icon="lock" />}
          />

          {/* 닉네임 */}
          <TextInput
            label="닉네임"
            value={nickname}
            onChangeText={setNickname}
            style={styles.input}
            error={!!errors.nickname}
          />
          {errors.nickname && (
            <HelperText type="error" visible={true}>
              {errors.nickname}
            </HelperText>
          )}

          {/* 비밀번호 변경 섹션 */}
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>비밀번호 변경 (선택사항)</Title>

          <TextInput
            label="현재 비밀번호"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={styles.input}
            error={!!errors.currentPassword}
          />
          {errors.currentPassword && (
            <HelperText type="error" visible={true}>
              {errors.currentPassword}
            </HelperText>
          )}

          <TextInput
            label="새 비밀번호"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            error={!!errors.newPassword}
          />
          {errors.newPassword && (
            <HelperText type="error" visible={true}>
              {errors.newPassword}
            </HelperText>
          )}

          <TextInput
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <HelperText type="error" visible={true}>
              {errors.confirmPassword}
            </HelperText>
          )}

          {/* 저장 버튼 */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
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
    margin: 20,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});