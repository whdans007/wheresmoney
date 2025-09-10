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
  ActivityIndicator,
  SegmentedButtons
} from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { HomeStackParamList } from '../../types';
import { CategoryService, CategoryData } from '../../services/category';
import { LedgerService } from '../../services/ledger';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

type AddEntryScreenRouteProp = RouteProp<HomeStackParamList, 'AddEntry'>;
type AddEntryScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'AddEntry'>;

interface Props {
  route: AddEntryScreenRouteProp;
  navigation: AddEntryScreenNavigationProp;
}

export default function AddEntryScreen({ route, navigation }: Props) {
  const { familyId } = route.params;
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense'); // 기본값: 지출
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const { isDarkMode, currency } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;

  // 선택된 타입에 따라 카테고리 결정
  const currentCategories = entryType === 'expense' ? 
    (expenseCategories.length > 0 ? expenseCategories : DEFAULT_CATEGORIES) : 
    INCOME_CATEGORIES;

  // 지출 카테고리만 로드 (수입 카테고리는 상수 사용)
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const result = await CategoryService.getExpenseCategories();
      if (result.success && result.categories) {
        setExpenseCategories(result.categories);
      } else {
        console.error('지출 카테고리 로딩 실패:', result.error);
        setError('지출 카테고리를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 로딩 예외:', error);
      setError('카테고리를 불러오는데 실패했습니다.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 화면 포커스될 때 카테고리 로드
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
  );

  // 엔트리 타입이 변경될 때 선택된 카테고리, 내용, 이미지 초기화
  useEffect(() => {
    setSelectedCategoryId('');
    setDescription('');
    setImage(null);
    setError('');
  }, [entryType]);

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
    // 지출의 경우 사진과 내용 필수
    if (entryType === 'expense') {
      if (!image) {
        setError('지출 기록은 사진이 필수입니다.');
        return;
      }
      if (!description.trim()) {
        setError('지출 기록은 내용이 필수입니다.');
        return;
      }
    }

    if (!amount || !selectedCategoryId) {
      setError('금액과 카테고리는 필수입니다.');
      return;
    }

    // 지출 선택시 임시 카테고리이면 에러
    if (entryType === 'expense' && selectedCategoryId.startsWith('temp-')) {
      setError('카테고리 정보를 불러오고 있습니다. 잠시 후 다시 시도해주세요.');
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
      // 수입은 음수로, 지출은 양수로 저장
      const finalAmount = entryType === 'income' ? -numericAmount : numericAmount;
      
      console.log(`${entryType === 'income' ? '수입' : '지출'} 저장 시작:`, {
        familyId,
        amount: finalAmount,
        categoryId: selectedCategoryId,
        description,
        imageUri: image,
      });

      const result = await LedgerService.createLedgerEntry({
        familyId,
        amount: finalAmount,
        categoryId: selectedCategoryId,
        description: entryType === 'expense' ? description.trim() : '수입',
        imageUri: entryType === 'expense' ? image : null,
      });

      if (!result.success) {
        setError(result.error || `${entryType === 'income' ? '수입' : '지출'} 저장에 실패했습니다.`);
        setLoading(false);
        return;
      }

      console.log(`${entryType === 'income' ? '수입' : '지출'} 저장 성공:`, result.entry);
      
      // 성공적으로 저장되면 뒤로 가기
      navigation.goBack();
    } catch (error: any) {
      console.error(`${entryType === 'income' ? '수입' : '지출'} 저장 예외:`, error);
      setError(`${entryType === 'income' ? '수입' : '지출'} 저장 중 오류가 발생했습니다.`);
      setLoading(false);
    }
  };

  const selectedCategory = currentCategories.find(cat => cat.id === selectedCategoryId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.card, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.title, { color: themeColors.text.primary }]}>가계부 작성</Title>

          {/* 수입/지출 선택 */}
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>종류</Text>
          <SegmentedButtons
            value={entryType}
            onValueChange={(value) => setEntryType(value as 'expense' | 'income')}
            buttons={[
              {
                value: 'expense',
                label: '지출',
                icon: 'minus',
                style: entryType === 'expense' ? { backgroundColor: '#FF6B6B' } : undefined,
              },
              {
                value: 'income',
                label: '수입',
                icon: 'plus',
                style: entryType === 'income' ? { backgroundColor: '#4CAF50' } : undefined,
              },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="금액"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text={currency.symbol} />}
          />

          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {entryType === 'expense' ? '지출 카테고리' : '수입 카테고리'}
          </Text>
          {categoriesLoading && entryType === 'expense' ? (
            <View style={styles.categoriesLoadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>카테고리 로딩 중...</Text>
            </View>
          ) : currentCategories.length === 0 && entryType === 'expense' ? (
            <View style={styles.categoriesLoadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>
                지출 카테고리를 초기화하는 중입니다...
              </Text>
            </View>
          ) : (
            <View style={styles.categoryContainer}>
              {currentCategories.map((category) => (
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
          )}

          {entryType === 'expense' && (
            <>
              <TextInput
                label="내용"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                multiline
                numberOfLines={3}
                onSubmitEditing={() => {
                  // 엔터 키 누르면 사진 추가 버튼 실행
                  if (!image) {
                    showImagePicker();
                  }
                }}
                blurOnSubmit={true}
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
                    사진 변경
                  </Button>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={showImagePicker}
                  style={styles.addImageButton}
                  icon="camera"
                >
                  사진 추가 (필수)
                </Button>
              )}
            </>
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
            disabled={
              !amount || 
              !selectedCategoryId || 
              (entryType === 'expense' && (!description.trim() || !image))
            }
            style={[
              styles.saveButton,
              { backgroundColor: entryType === 'expense' ? '#FF6B6B' : '#4CAF50' }
            ]}
          >
            {entryType === 'expense' ? '지출 저장' : '수입 저장'}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
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
  categoriesLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
});