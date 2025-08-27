import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  FAB,
  List,
  Chip,
  Badge
} from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';

type FamilyDetailScreenRouteProp = RouteProp<HomeStackParamList, 'FamilyDetail'>;
type FamilyDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'FamilyDetail'>;

interface Props {
  route: FamilyDetailScreenRouteProp;
  navigation: FamilyDetailScreenNavigationProp;
}

export default function FamilyDetailScreen({ route, navigation }: Props) {
  const { familyId } = route.params;
  const [selectedTab, setSelectedTab] = useState<'ledger' | 'members'>('ledger');

  // Mock data - TODO: Get from store/API
  const family = {
    id: familyId,
    name: '우리 가족',
    description: '가족 가계부입니다',
  };

  const ledgerEntries = [
    {
      id: '1',
      amount: 15000,
      category: '식비',
      description: '점심 식사',
      user: '엄마',
      date: '2024-01-15',
    },
    {
      id: '2',
      amount: 50000,
      category: '쇼핑',
      description: '생필품 구매',
      user: '아빠',
      date: '2024-01-14',
    },
  ];

  const members = [
    { id: '1', name: '엄마', role: 'owner' },
    { id: '2', name: '아빠', role: 'member' },
    { id: '3', name: '철수', role: 'member' },
  ];

  const renderLedgerItem = ({ item }: any) => (
    <List.Item
      title={`${item.amount.toLocaleString()}원`}
      description={`${item.description} • ${item.user}`}
      left={() => (
        <View style={styles.categoryChip}>
          <Chip compact>{item.category}</Chip>
        </View>
      )}
      right={() => <Text style={styles.dateText}>{item.date}</Text>}
      onPress={() => navigation.navigate('LedgerDetail', { entryId: item.id })}
    />
  );

  const renderMemberItem = ({ item }: any) => (
    <List.Item
      title={item.name}
      left={(props) => <List.Icon {...props} icon="account" />}
      right={() => (
        item.role === 'owner' ? (
          <Badge style={styles.ownerBadge}>방장</Badge>
        ) : null
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>{family.name}</Title>
          <Text>{family.description}</Text>
        </Card.Content>
      </Card>

      <View style={styles.tabContainer}>
        <Button
          mode={selectedTab === 'ledger' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('ledger')}
          style={[styles.tabButton, selectedTab === 'ledger' && styles.activeTab]}
        >
          가계부
        </Button>
        <Button
          mode={selectedTab === 'members' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('members')}
          style={[styles.tabButton, selectedTab === 'members' && styles.activeTab]}
        >
          멤버
        </Button>
      </View>

      <Card style={styles.contentCard}>
        {selectedTab === 'ledger' ? (
          <FlatList
            data={ledgerEntries}
            renderItem={renderLedgerItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                아직 가계부 내역이 없습니다.{'\n'}
                첫 번째 내역을 추가해보세요!
              </Text>
            }
          />
        ) : (
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
          />
        )}
      </Card>

      {selectedTab === 'ledger' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddLedgerEntry', { familyId })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 20,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  activeTab: {
    // Additional styling for active tab if needed
  },
  contentCard: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    alignSelf: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    lineHeight: 20,
  },
  ownerBadge: {
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});