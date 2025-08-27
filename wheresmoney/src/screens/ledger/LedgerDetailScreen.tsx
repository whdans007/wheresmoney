import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card,
  Title,
  Button,
  Chip,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { useAuthStore } from '../../stores/authStore';

type LedgerDetailScreenRouteProp = RouteProp<HomeStackParamList, 'LedgerDetail'>;
type LedgerDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'LedgerDetail'>;

interface Props {
  route: LedgerDetailScreenRouteProp;
  navigation: LedgerDetailScreenNavigationProp;
}

export default function LedgerDetailScreen({ route, navigation }: Props) {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      const result = await LedgerService.getLedgerEntry(entryId);
      
      if (result.success && result.entry) {
        setEntry(result.entry);
      } else {
        Alert.alert('오류', result.error || '가계부 내용을 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('가계부 상세 로딩 실패:', error);
      Alert.alert('오류', '가계부 내용을 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!entry || entry.user_id !== user?.id) {
      Alert.alert('권한 없음', '본인이 작성한 가계부만 수정할 수 있습니다.');
      return;
    }
    
    // TODO: EditLedgerEntryScreen으로 네비게이션 구현
    Alert.alert('개발 중', '가계부 수정 기능은 곧 제공됩니다.');
  };

  const handleDelete = () => {
    if (!entry || entry.user_id !== user?.id) {
      Alert.alert('권한 없음', '본인이 작성한 가계부만 삭제할 수 있습니다.');
      return;
    }

    Alert.alert(
      '가계부 삭제',
      '정말로 이 가계부를 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await LedgerService.deleteLedgerEntry(entryId);
      
      if (result.success) {
        Alert.alert('삭제 완료', '가계부가 삭제되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('삭제 실패', result.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('가계부 삭제 실패:', error);
      Alert.alert('삭제 실패', '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>가계부 로딩 중...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>가계부를 찾을 수 없습니다.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          돌아가기
        </Button>
      </View>
    );
  }

  const category = DEFAULT_CATEGORIES.find(cat => cat.id === entry.category_id);
  const isOwner = entry.user_id === user?.id;
  const displayDate = new Date(entry.created_at).toLocaleDateString('ko-KR');
  const displayTime = new Date(entry.created_at).toLocaleTimeString('ko-KR');

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.amount}>
              {entry.amount.toLocaleString()}원
            </Title>
            {category && (
              <Chip 
                style={[styles.categoryChip, { backgroundColor: category.color }]}
                textStyle={{ color: 'white' }}
              >
                {category.name}
              </Chip>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>작성자</Text>
            <Text style={styles.value}>{entry.users?.nickname}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>날짜</Text>
            <Text style={styles.value}>{displayDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>작성 시간</Text>
            <Text style={styles.value}>{displayTime}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.label}>내용</Text>
          <Text style={styles.description}>{entry.description}</Text>

          <Text style={styles.label}>사진</Text>
          <Image source={{ uri: entry.photo_url }} style={styles.photo} />

          {isOwner && (
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleEdit}
                style={styles.editButton}
                disabled={deleting}
              >
                수정
              </Button>
              <Button
                mode="contained"
                onPress={handleDelete}
                style={styles.deleteButton}
                buttonColor="#B00020"
                loading={deleting}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </View>
          )}

          {!isOwner && (
            <Text style={styles.noPermissionText}>
              본인이 작성한 가계부만 수정/삭제할 수 있습니다.
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    margin: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  noPermissionText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});