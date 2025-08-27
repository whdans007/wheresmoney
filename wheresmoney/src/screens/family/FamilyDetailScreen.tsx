import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, LinearGradient } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  FAB,
  List,
  Chip,
  Badge,
  ActivityIndicator
} from 'react-native-paper';
import { colors, spacing, shadows, textStyles } from '../../theme';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { useFamilyStore } from '../../stores/familyStore';
import { FamilyMembersService } from '../../services/familyMembers';

type FamilyDetailScreenRouteProp = RouteProp<HomeStackParamList, 'FamilyDetail'>;
type FamilyDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'FamilyDetail'>;

interface Props {
  route: FamilyDetailScreenRouteProp;
  navigation: FamilyDetailScreenNavigationProp;
}

export default function FamilyDetailScreen({ route, navigation }: Props) {
  const { familyId } = route.params;
  const [selectedTab, setSelectedTab] = useState<'ledger' | 'members'>('members');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [displayName, setDisplayName] = useState<string>('');
  
  const { families } = useFamilyStore();
  const family = families.find(f => f.id === familyId);

  const loadLedgerEntries = async () => {
    setLoading(true);
    try {
      const result = await LedgerService.getLedgerEntries(familyId);
      if (result.success && result.entries) {
        setLedgerEntries(result.entries);
        
        // 총 금액 계산
        const total = result.entries.reduce((sum, entry) => sum + entry.amount, 0);
        setTotalAmount(total);
      } else {
        console.error('가계부 로딩 실패:', result.error);
      }
    } catch (error) {
      console.error('가계부 로딩 예외:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const result = await FamilyMembersService.getFamilyMembers(familyId);
      if (result.success && result.members) {
        // 참여일 기준으로 최신순 정렬 (최신 참여자가 위로)
        const sortedMembers = result.members.sort((a: any, b: any) => 
          new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
        );
        setMembers(sortedMembers);
        
        // 가족방 이름 동적 생성
        if (result.members.length > 0) {
          const memberNames = result.members
            .slice(0, 3) // 최대 3명까지만 표시
            .map((member: any) => member.users?.nickname || '사용자')
            .join(', ');
          
          const remainingCount = result.members.length > 3 ? result.members.length - 3 : 0;
          const dynamicName = remainingCount > 0 
            ? `${memberNames} 외 ${remainingCount}명의 가족방`
            : `${memberNames}의 가족방`;
            
          setDisplayName(dynamicName);
        } else {
          setDisplayName(family?.name || '가족방');
        }
      } else {
        console.error('가족 구성원 로딩 실패:', result.error);
        setDisplayName(family?.name || '가족방');
      }
    } catch (error) {
      console.error('가족 구성원 로딩 예외:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  // 화면 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadLedgerEntries();
      loadMembers();
    }, [familyId])
  );

  const renderLedgerItem = ({ item }: any) => {
    const category = DEFAULT_CATEGORIES.find(cat => cat.id === item.category_id);
    const userName = item.users?.nickname || '사용자';
    const displayDate = new Date(item.created_at).toLocaleDateString('ko-KR');
    
    return (
      <List.Item
        title={`${item.amount.toLocaleString()}원`}
        description={`${item.description} • ${userName}`}
        left={() => (
          <View style={styles.categoryContainer}>
            <Image source={{ uri: item.photo_url }} style={styles.thumbnailImage} />
          </View>
        )}
        right={() => (
          <View style={styles.rightContainer}>
            {category && (
              <Chip 
                compact 
                style={[styles.categoryChip, { backgroundColor: category.color }]}
                textStyle={{ color: 'white', fontSize: 10 }}
              >
                {category.name}
              </Chip>
            )}
            <Text style={styles.dateText}>{displayDate}</Text>
          </View>
        )}
        onPress={() => {
          navigation.navigate('LedgerDetail', { entryId: item.id });
        }}
        style={styles.ledgerItem}
      />
    );
  };

  const renderMemberItem = ({ item }: any) => {
    // 최근 5분 이내 참여한 사용자는 "새로운 멤버"로 표시
    const isNewMember = new Date().getTime() - new Date(item.joined_at).getTime() < 5 * 60 * 1000;
    
    return (
      <List.Item
        title={item.users?.nickname || '사용자'}
        description={item.users?.email}
        left={(props) => (
          item.users?.avatar_url ? (
            <Image source={{ uri: item.users.avatar_url }} style={styles.memberAvatar} />
          ) : (
            <List.Icon {...props} icon="account" />
          )
        )}
        right={() => (
          <View style={styles.memberRightContainer}>
            {isNewMember && (
              <Badge style={styles.newMemberBadge}>새 멤버</Badge>
            )}
            {item.role === 'owner' && (
              <Badge style={styles.ownerBadge}>방장</Badge>
            )}
            <Text style={styles.joinedDateText}>
              {new Date(item.joined_at).toLocaleDateString('ko-KR')}
            </Text>
          </View>
        )}
        style={isNewMember ? styles.newMemberItem : undefined}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>{displayName || family?.name || '가족방'}</Title>
          <Text>{family?.description || ''}</Text>
          {selectedTab === 'ledger' && (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <Text 
                  style={styles.totalAmountText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  이번 달 총 지출: {totalAmount.toLocaleString()}원
                </Text>
                <Button
                  mode="outlined"
                  icon="chart-line"
                  onPress={() => navigation.navigate('Stats', { familyId })}
                  style={styles.statsButton}
                  compact
                  labelStyle={styles.statsButtonLabel}
                >
                  통계
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.tabContainer}>
        <Button
          mode={selectedTab === 'ledger' ? 'contained' : 'outlined'}
          onPress={() => {
            console.log('Switching to ledger tab');
            setSelectedTab('ledger');
          }}
          style={[styles.tabButton, selectedTab === 'ledger' && styles.activeTab]}
        >
          가계부
        </Button>
        <Button
          mode={selectedTab === 'members' ? 'contained' : 'outlined'}
          onPress={() => {
            console.log('Switching to members tab');
            setSelectedTab('members');
          }}
          style={[styles.tabButton, selectedTab === 'members' && styles.activeTab]}
        >
          멤버
        </Button>
      </View>

      <Card style={styles.contentCard}>
        {selectedTab === 'ledger' ? (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>가계부 로딩 중...</Text>
            </View>
          ) : (
            <FlatList
              data={ledgerEntries}
              renderItem={renderLedgerItem}
              keyExtractor={(item) => item.id}
              onRefresh={loadLedgerEntries}
              refreshing={loading}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  아직 가계부 내역이 없습니다.{'\n'}
                  첫 번째 내역을 추가해보세요!
                </Text>
              }
            />
          )
        ) : (
          membersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>구성원 로딩 중...</Text>
            </View>
          ) : (
            <View style={styles.membersContainer}>
              <View style={styles.memberHeader}>
                <Text style={styles.memberTitle}>
                  가족 구성원 ({members.length}명)
                </Text>
                <Button
                  mode="contained"
                  icon="account-plus"
                  onPress={() => navigation.navigate('Invite', { familyId })}
                  style={styles.inviteButton}
                  compact
                  buttonColor={colors.primary[500]}
                  textColor="white"
                  contentStyle={{ height: 36 }}
                  labelStyle={{ fontSize: 14, fontWeight: '600' }}
                >
                  초대
                </Button>
              </View>
              <FlatList
                data={members}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item.id}
                onRefresh={loadMembers}
                refreshing={membersLoading}
                style={styles.membersList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    가족 구성원이 없습니다.
                  </Text>
                }
              />
            </View>
          )
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
    backgroundColor: colors.background.secondary,
  },
  headerCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: colors.surface.primary,
    borderRadius: 24,
    ...shadows.medium,
    overflow: 'hidden',
    minHeight: 'auto',
  },
  statsContainer: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: spacing[2],
  },
  totalAmountText: {
    ...textStyles.body1,
    fontWeight: '600',
    color: colors.secondary[500],
    flex: 1,
    flexShrink: 1,
    marginRight: spacing[2],
  },
  statsButton: {
    borderColor: colors.accent[500],
    borderRadius: spacing[4],
    paddingHorizontal: spacing[3],
    flexShrink: 0,
    minWidth: 70,
  },
  statsButtonLabel: {
    fontSize: 12,
    marginHorizontal: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[2],
  },
  tabButton: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  activeTab: {
    // Additional styling for active tab if needed
  },
  contentCard: {
    flex: 1,
    marginHorizontal: spacing[5],
    marginBottom: spacing[5],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[10],
  },
  loadingText: {
    marginTop: spacing[2],
    ...textStyles.body2,
    color: colors.text.secondary,
  },
  ledgerItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoryContainer: {
    justifyContent: 'center',
    paddingLeft: spacing[4],
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: spacing[2],
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  categoryChip: {
    marginBottom: spacing[1],
    minWidth: 50,
  },
  dateText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  emptyText: {
    ...textStyles.body2,
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing[10],
    lineHeight: 20,
  },
  ownerBadge: {
    alignSelf: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: spacing[4],
    alignSelf: 'center',
  },
  memberRightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  joinedDateText: {
    ...textStyles.caption,
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  fab: {
    position: 'absolute',
    margin: spacing[4],
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent[500], // Soft coral pink for action
    borderRadius: 20,
    ...shadows.medium,
  },
  membersContainer: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.surface.primary,
  },
  memberTitle: {
    ...textStyles.h4,
    fontSize: spacing[4],
  },
  inviteButton: {
    borderRadius: spacing[3],
    backgroundColor: colors.primary[500],
    minWidth: 80,
    height: 36,
  },
  membersList: {
    flex: 1,
  },
  debugText: {
    ...textStyles.caption,
    color: colors.error,
    padding: spacing[2],
    backgroundColor: colors.background.tertiary,
  },
  newMemberBadge: {
    backgroundColor: colors.accent[500],
    marginBottom: spacing[1],
  },
  newMemberItem: {
    backgroundColor: colors.accent[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.accent[500],
  },
});