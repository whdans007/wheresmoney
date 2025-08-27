import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  TextInput, 
  Button, 
  Card,
  HelperText,
  Title
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';
import { FamilyService } from '../../services/family';
import { useFamilyStore } from '../../stores/familyStore';

type CreateFamilyScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'CreateFamily'>;

interface Props {
  navigation: CreateFamilyScreenNavigationProp;
}

export default function CreateFamilyScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addFamily } = useFamilyStore();

  const handleCreateFamily = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { family, error } = await FamilyService.createFamily(name.trim(), description.trim());
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      
      if (family) {
        // Add to local store
        addFamily({ ...family, user_role: 'owner' });
        navigation.goBack();
      }
      
      setLoading(false);
    } catch (err: any) {
      setError('가족방 생성에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>새 가족방 만들기</Title>

          <TextInput
            label="가족방 이름"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="우리 가족"
          />

          <TextInput
            label="설명 (선택사항)"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="가족방에 대한 간단한 설명을 입력하세요"
          />

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleCreateFamily}
            loading={loading}
            disabled={!name.trim()}
            style={styles.button}
          >
            가족방 만들기
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
});