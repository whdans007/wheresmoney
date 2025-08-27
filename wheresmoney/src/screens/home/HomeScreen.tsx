import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  List,
  ActivityIndicator
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '../../types';
import { useFamilyStore } from '../../stores/familyStore';
import { FamilyService } from '../../services/family';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { families, loading, setFamilies, setLoading } = useFamilyStore();

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const { families: userFamilies, error } = await FamilyService.getUserFamilies();
      if (error) {
        console.error('Failed to load families:', error);
      } else {
        setFamilies(userFamilies);
      }
    } catch (error) {
      console.error('Error loading families:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFamilies();
    }, [])
  );

  const renderFamilyItem = ({ item }: { item: any }) => (
    <List.Item
      title={item.name}
      description={item.description || '설명 없음'}
      left={(props) => <List.Icon {...props} icon="home-group" />}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={() => navigation.navigate('FamilyDetail', { familyId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title>안녕하세요! 👋</Title>
          <Text>가족과 함께 가계부를 관리해보세요</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('CreateFamily')}
          style={styles.actionButton}
          icon="plus"
        >
          새 가족방 만들기
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('JoinFamily')}
          style={styles.actionButton}
          icon="account-plus"
        >
          가족방 참여
        </Button>
      </View>

      <Card style={styles.familiesCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>내 가족방</Title>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>가족방 불러오는 중...</Text>
            </View>
          ) : families.length === 0 ? (
            <Text style={styles.emptyText}>
              아직 가족방이 없습니다.{'\n'}
              새 가족방을 만들어보세요!
            </Text>
          ) : (
            <FlatList
              data={families}
              renderItem={renderFamilyItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  welcomeCard: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
  familiesCard: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginLeft: 12,
    color: '#666',
  },
});