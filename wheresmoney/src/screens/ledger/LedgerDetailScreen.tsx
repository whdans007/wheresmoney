import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { 
  Text, 
  Card,
  Title,
  Button,
  Chip,
  Divider
} from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';

type LedgerDetailScreenRouteProp = RouteProp<HomeStackParamList, 'LedgerDetail'>;
type LedgerDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'LedgerDetail'>;

interface Props {
  route: LedgerDetailScreenRouteProp;
  navigation: LedgerDetailScreenNavigationProp;
}

export default function LedgerDetailScreen({ route, navigation }: Props) {
  const { entryId } = route.params;

  // Mock data - TODO: Get from store/API
  const entry = {
    id: entryId,
    amount: 15000,
    category: { name: '식비', color: '#FF6B6B' },
    description: '점심 식사 - 삼겹살집에서 가족과 함께',
    photo_url: 'https://via.placeholder.com/300x200',
    date: '2024-01-15',
    created_at: '2024-01-15 14:30',
    user: { nickname: '엄마' },
  };

  const handleEdit = () => {
    // TODO: Navigate to edit screen
    console.log('Edit entry:', entryId);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete entry:', entryId);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.amount}>
              {entry.amount.toLocaleString()}원
            </Title>
            <Chip 
              style={[styles.categoryChip, { backgroundColor: entry.category.color }]}
              textStyle={{ color: 'white' }}
            >
              {entry.category.name}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>작성자</Text>
            <Text style={styles.value}>{entry.user.nickname}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>날짜</Text>
            <Text style={styles.value}>{entry.date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>작성 시간</Text>
            <Text style={styles.value}>{entry.created_at}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.label}>내용</Text>
          <Text style={styles.description}>{entry.description}</Text>

          <Text style={styles.label}>사진</Text>
          <Image source={{ uri: entry.photo_url }} style={styles.photo} />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleEdit}
              style={styles.editButton}
            >
              수정
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              style={styles.deleteButton}
              buttonColor="#B00020"
            >
              삭제
            </Button>
          </View>
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
});