import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Card,
  HelperText,
  Title,
  Text,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';
import { INCOME_CATEGORIES } from '../../constants/categories';
import { useTranslation } from 'react-i18next';

type AddIncomeEntryScreenRouteProp = RouteProp<HomeStackParamList, 'AddIncomeEntry'>;
type AddIncomeEntryScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'AddIncomeEntry'>;

interface Props {
  route: AddIncomeEntryScreenRouteProp;
  navigation: AddIncomeEntryScreenNavigationProp;
}

export default function AddIncomeEntryScreen({ route, navigation }: Props) {
  const { familyId } = route.params;
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDarkMode, currency } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const { t } = useTranslation();

  // 이미지 리사이즈 함수
  const resizeImage = async (uri: string): Promise<string> => {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 800 } }, // 너비 800px로 리사이즈 (비율 유지)
      ],
      {
        compress: 0.8, // 80% 품질로 압축
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return manipulatedImage.uri;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.9, // 90% 품질
    });

    if (!result.canceled) {
      const resizedUri = await resizeImage(result.assets[0].uri);
      setImage(resizedUri);
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
      aspect: [2, 3],
      quality: 0.9, // 90% 품질
    });

    if (!result.canceled) {
      const resizedUri = await resizeImage(result.assets[0].uri);
      setImage(resizedUri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '사진 선택',
      '사진을 어떻게 추가하시겠습니까?',
      [
        { text: '카메라', onPress: takePhoto },
        { text: '갤러리', onPress: pickImage },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!image) {
      setError('사진은 필수입니다.');
      return;
    }

    if (!amount || !selectedCategoryId || !description.trim()) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('수입 저장 시작:', {
        familyId,
        amount: -numericAmount, // 수입은 음수로 저장
        categoryId: selectedCategoryId,
        description,
        imageUri: image,
      });

      const result = await LedgerService.createLedgerEntry({
        familyId,
        amount: -numericAmount, // 수입은 음수로 저장
        categoryId: selectedCategoryId,
        description: description.trim(),
        imageUri: image,
      });

      if (!result.success) {
        setError(result.error || '수입 저장에 실패했습니다.');
        setLoading(false);
        return;
      }

      console.log('수입 저장 성공:', result.entry);
      
      // 성공적으로 저장되면 뒤로 가기
      navigation.goBack();
    } catch (error: any) {
      console.error('수입 저장 예외:', error);
      setError('수입 저장 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const selectedCategory = INCOME_CATEGORIES.find(cat => cat.id === selectedCategoryId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>{t('navigation.addIncome')}</Title>

          <TextInput
            label={t('entry.amount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text={currency.symbol} />}
          />

          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>수입 카테고리</Text>
          <View style={styles.categoryContainer}>
            {INCOME_CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                selected={selectedCategoryId === category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === category.id && { backgroundColor: category.color }
                ]}
                textStyle={selectedCategoryId === category.id && { color: 'white' }}
              >
                {category.name}
              </Chip>
            ))}
          </View>

          <TextInput
            label={t('entry.content')}
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>사진 (필수)</Text>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <Button
                mode="outlined"
                onPress={showImagePicker}
                style={styles.changeImageButton}
              >
                {t('image.changePhoto')}
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={showImagePicker}
              style={styles.addImageButton}
              icon="camera"
            >
              {t('image.addPhotoRequired')}
            </Button>
          )}

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={!amount || !selectedCategoryId || !description.trim() || !image}
            style={styles.saveButton}
          >
            {t('entry.saveIncome')}
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
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    margin: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 300,
    borderRadius: 8,
    marginBottom: 8,
  },
  changeImageButton: {
    width: 120,
  },
  addImageButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});