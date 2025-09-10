import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [nickname, setNickname] = useState(user?.nickname || '');
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
      newErrors.nickname = t('profile.validation.nicknameRequired');
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = t('profile.validation.nicknameMinLength');
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        newErrors.newPassword = t('profile.validation.passwordMinLength');
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = t('profile.validation.passwordMismatch');
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
      Alert.alert(t('profile.errors.cameraPermissionNeeded'), t('profile.errors.cameraPermissionMessage'));
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
      t('profile.profilePhoto'),
      t('profile.profilePhotoChangeMessage'),
      [
        { text: t('image.camera'), onPress: takePhoto },
        { text: t('image.gallery'), onPress: pickImage },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const uploadAvatar = async (imageUri: string): Promise<string | null> => {
    try {
      if (!user) return null;

      console.log('아바타 업로드 시작:', imageUri);
      
      // React Native fetch를 사용한 방식
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // ArrayBuffer 대신 직접 blob을 사용
      const fileName = `${user.id}/avatar_${Date.now()}.jpg`;
      
      console.log('파일명:', fileName);
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
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
          Alert.alert(t('common.error'), t('profile.errors.avatarUploadFailed'));
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
        Alert.alert(t('common.error'), t('profile.errors.profileUpdateFailed'));
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
          Alert.alert(t('common.error'), t('profile.errors.passwordChangeFailed'));
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

      Alert.alert(t('common.success'), t('profile.success.profileUpdated'), [
        { text: t('common.confirm'), onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error('프로필 저장 예외:', error);
      Alert.alert(t('common.error'), t('profile.errors.profileSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>{t('navigation.editProfile')}</Title>

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
              {t('image.changePhoto')}
            </Button>
          </View>

          {/* 이메일 (읽기 전용) */}
          <TextInput
            label={t('profile.email')}
            value={user?.email || ''}
            style={styles.input}
            editable={false}
            right={<TextInput.Icon icon="lock" />}
          />

          {/* 닉네임 */}
          <TextInput
            label={t('profile.nickname')}
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
          <Title style={[styles.sectionTitle, { color: themeColors.text.primary }]}>{t('profile.changePassword')}</Title>

          <TextInput
            label={t('profile.newPassword')}
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
            label={t('profile.confirmNewPassword')}
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
            {loading ? t('common.saving') : t('common.save')}
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