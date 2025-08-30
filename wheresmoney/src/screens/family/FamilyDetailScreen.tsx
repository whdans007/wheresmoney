import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
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
import { FamilyService } from '../../services/family';
import { supabase } from '../../services/supabase';

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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  
  const { families, setFamilies } = useFamilyStore();
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
    console.log('=== loadMembers started ===');
    console.log('Family ID:', familyId);
    setMembersLoading(true);
    try {
      const result = await FamilyMembersService.getFamilyMembers(familyId);
      console.log('=== getFamilyMembers result ===');
      console.log('Success:', result.success);
      console.log('Members count:', result.members?.length);
      console.log('Members data:', JSON.stringify(result.members, null, 2));
      console.log('Error:', result.error);
      
      if (result.success && result.members) {
        // 등록된 순서대로 정렬 (joined_at 오름차순 - 먼저 등록한 사람이 위에)
        const sortedMembers = result.members.sort((a: any, b: any) => {
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
        });
        
        console.log('=== Sorted members ===');
        console.log('Sorted count:', sortedMembers.length);
        console.log('Sorted data:', sortedMembers.map(m => ({ 
          id: m.id, 
          role: m.role, 
          nickname: m.users?.nickname,
          user_id: m.user_id,
          joined_at: m.joined_at
        })));
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
        setMembers([]);
        setDisplayName(family?.name || '가족방');
      }
    } catch (error) {
      console.error('가족 구성원 로딩 예외:', error);
      setMembers([]);
      setDisplayName(family?.name || '가족방');
    } finally {
      setMembersLoading(false);
    }
  };

  // 현재 사용자 정보 가져오기
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // 방장인지 확인
        setIsOwner(family?.owner_id === user.id || false);
      }
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error);
    }
  };

  // 가족방 탈퇴
  const leaveFamily = async () => {
    Alert.alert(
      '가족방 탈퇴',
      '정말로 이 가족방에서 탈퇴하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FamilyMembersService.leaveFamily(familyId);
              if (result.success) {
                Alert.alert(
                  '탈퇴 완료',
                  '가족방에서 성공적으로 탈퇴했습니다.',
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        // 가족 목록 새로고침 후 홈으로 이동
                        const updatedFamilies = families.filter(f => f.id !== familyId);
                        setFamilies(updatedFamilies);
                        navigation.navigate('HomeScreen');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('탈퇴 실패', result.error || '탈퇴 중 오류가 발생했습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '가족방 탈퇴 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 가족방 삭제 (방장만 가능)
  const deleteFamily = async () => {
    Alert.alert(
      '가족방 삭제',
      '정말로 이 가족방을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 가계부 기록도 함께 삭제됩니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting family deletion:', familyId);
              const result = await FamilyService.deleteFamily(familyId);
              console.log('Delete family result:', result);
              if (result.success) {
                Alert.alert(
                  '삭제 완료',
                  '가족방이 성공적으로 삭제되었습니다.',
                  [
                    {
                      text: '확인',
                      onPress: async () => {
                        // 가족 목록 새로고침
                        try {
                          const familiesResult = await FamilyService.getUserFamilies();
                          console.log('Family list refresh after deletion:', familiesResult);
                          if (familiesResult.families) {
                            setFamilies(familiesResult.families);
                          }
                        } catch (error) {
                          console.error('가족 목록 새로고침 실패:', error);
                          // 에러가 발생해도 로컬 상태는 업데이트
                          const updatedFamilies = families.filter(f => f.id !== familyId);
                          setFamilies(updatedFamilies);
                        }
                        navigation.navigate('HomeScreen');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('삭제 실패', result.error || '가족방 삭제 중 오류가 발생했습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '가족방 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 화면 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      getCurrentUser();
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
    
    // 현재 사용자인지 확인
    const isCurrentUser = item.user_id === currentUserId;
    
    // 표시될 이름 결정
    const displayName = isCurrentUser 
      ? '나' 
      : (item.users?.nickname || '사용자');
    
    return (
      <List.Item
        title={displayName}
        description={item.users?.email || '이메일 없음'}
        left={(props) => (
          item.users?.avatar_url ? (
            <Image source={{ uri: item.users.avatar_url }} style={styles.memberAvatar} />
          ) : (
            <List.Icon {...props} icon={isCurrentUser ? "account-circle" : "account"} />
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
            <View style={styles.joinedDateContainer}>
              <Text style={styles.joinedDateText}>
                {new Date(item.joined_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        )}
        style={[
          isNewMember ? styles.newMemberItem : styles.memberItem,
          { backgroundColor: colors.surface.primary }
        ]}
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
        <View style={styles.cardContentStyle}>
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
                  {isOwner ? (
                    <View style={styles.ownerButtonsContainer}>
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
                      <Button
                        mode="contained"
                        icon="delete"
                        onPress={deleteFamily}
                        style={styles.deleteButton}
                        compact
                        buttonColor={colors.error}
                        textColor="white"
                        contentStyle={{ height: 36 }}
                        labelStyle={{ fontSize: 14, fontWeight: '600' }}
                      >
                        삭제
                      </Button>
                    </View>
                  ) : (
                    <Button
                      mode="outlined"
                      icon="exit-to-app"
                      onPress={leaveFamily}
                      style={styles.leaveButton}
                      compact
                      buttonColor="transparent"
                      textColor={colors.error}
                      contentStyle={{ height: 36 }}
                      labelStyle={{ fontSize: 14, fontWeight: '600' }}
                    >
                      탈퇴
                    </Button>
                  )}
                </View>
                <FlatList
                  data={members}
                  renderItem={renderMemberItem}
                  keyExtractor={(item) => item.id}
                  onRefresh={loadMembers}
                  refreshing={membersLoading}
                  style={styles.membersList}
                  contentContainerStyle={{ flexGrow: 1 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      가족 구성원이 없습니다.
                    </Text>
                  }
                />
              </View>
            )
          )}
        </View>
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
  cardContentStyle: {
    flex: 1,
    padding: spacing[4],
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
    minHeight: 60, // 충분한 높이 확보
  },
  joinedDateContainer: {
    minHeight: 20, // 날짜 텍스트를 위한 충분한 공간
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  joinedDateText: {
    ...textStyles.caption,
    fontSize: 12, // 조금 더 크게
    color: colors.text.secondary,
    lineHeight: 16, // 줄 높이 명시적으로 설정
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
    paddingBottom: spacing[3],
    marginBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  leaveButton: {
    borderRadius: spacing[3],
    borderColor: colors.error,
    minWidth: 80,
    height: 36,
  },
  ownerButtonsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  deleteButton: {
    borderRadius: spacing[3],
    backgroundColor: colors.error,
    minWidth: 60,
    height: 36,
  },
  membersList: {
    flex: 1,
    minHeight: 200,
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
  memberItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
});