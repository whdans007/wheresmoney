import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Card,
  HelperText,
  Title,
  Text,
  Chip
} from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { HomeStackParamList } from '../../types';
import { DEFAULT_CATEGORIES } from '../../constants/categories';

type AddLedgerEntryScreenRouteProp = RouteProp<HomeStackParamList, 'AddLedgerEntry'>;
type AddLedgerEntryScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'AddLedgerEntry'>;

interface Props {
  route: AddLedgerEntryScreenRouteProp;
  navigation: AddLedgerEntryScreenNavigationProp;
}

export default function AddLedgerEntryScreen({ route, navigation }: Props) {
  const { familyId } = route.params;
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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

    setLoading(true);
    setError('');
    
    try {
      // TODO: Implement ledger entry creation with Supabase
      console.log('Creating ledger entry:', {
        familyId,
        amount: parseFloat(amount),
        categoryId: selectedCategoryId,
        description,
        image,
      });
      
      // Mock success
      setTimeout(() => {
        setLoading(false);
        navigation.goBack();
      }, 1000);
    } catch (err) {
      setError('가계부 저장에 실패했습니다.');
      setLoading(false);
    }
  };

  const selectedCategory = DEFAULT_CATEGORIES.find(cat => cat.id === selectedCategoryId);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>가계부 작성</Title>

          <TextInput
            label="금액"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text="원" />}
          />

          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {DEFAULT_CATEGORIES.map((category) => (
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
            label="내용"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sectionTitle}>사진 (필수)</Text>
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
            저장
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
    height: 150,
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