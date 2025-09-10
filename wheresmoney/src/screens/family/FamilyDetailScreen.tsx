import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  FAB,
  List,
  Chip,
  Badge,
  ActivityIndicator,
  IconButton
} from 'react-native-paper';
import { colors, spacing, shadows, textStyles } from '../../theme';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { CategoryService, CategoryData } from '../../services/category';
import { useFamilyStore } from '../../stores/familyStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { FamilyMembersService } from '../../services/familyMembers';
import { FamilyService } from '../../services/family';
import { supabase } from '../../services/supabase';
import { darkColors } from '../../theme';

type FamilyDetailScreenRouteProp = RouteProp<HomeStackParamList, 'FamilyDetail'>;
type FamilyDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'FamilyDetail'>;

interface Props {
  route: FamilyDetailScreenRouteProp;
  navigation: FamilyDetailScreenNavigationProp;
}

export default function FamilyDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { familyId } = route.params;
  const [selectedTab, setSelectedTab] = useState<'ledger' | 'members'>('ledger');
  const [selectedDate, setSelectedDate] = useState(new Date()); // 선택된 년월
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [displayName, setDisplayName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  
  const { families, setFamilies } = useFamilyStore();
  const { isDarkMode, currency } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const family = families.find(f => f.id === familyId);

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  // 현재 달로 돌아가기
  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // 선택된 날짜 문자열 생성
  const getSelectedDateString = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    return `${year}${t('common.year')} ${month}${t('common.month')}`;
  };

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      const result = await CategoryService.getCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Category loading failed:', error);
    }
  };

  const loadLedgerEntries = async () => {
    setLoading(true);
    try {
      console.log('Loading ledger entries for familyId:', familyId);
      const result = await LedgerService.getLedgerEntries(familyId);
      console.log('Ledger entries result:', result);
      
      if (result.success && result.entries) {
        console.log('Ledger entries loaded:', result.entries.length);
        
        // 선택된 월의 데이터만 필터링
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;
        
        const filteredEntries = result.entries.filter(entry => {
          const entryDate = entry.date || entry.created_at?.split('T')[0];
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        console.log(`Filtered entries for ${getSelectedDateString()}:`, filteredEntries.length);
        setLedgerEntries(filteredEntries);
        
        // 총 금액 계산 (필터링된 데이터 기준)
        const total = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const income = filteredEntries
          .filter(entry => entry.amount < 0)
          .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
        const expense = filteredEntries
          .filter(entry => entry.amount > 0)
          .reduce((sum, entry) => sum + entry.amount, 0);
        
        setTotalAmount(total);
        setTotalIncome(income);
        setTotalExpense(expense);
      } else {
        console.error('Ledger loading failed:', result.error);
        setLedgerEntries([]);
      }
    } catch (error) {
      console.error('Ledger loading exception:', error);
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const result = await FamilyMembersService.getFamilyMembers(familyId);
      
      if (result.success && result.members) {
        // 등록된 순서대로 정렬 (joined_at 오름차순 - 먼저 등록한 사람이 위에)
        const sortedMembers = result.members.sort((a: any, b: any) => {
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
        });
        setMembers(sortedMembers);
      } else {
        console.error('Family members loading failed:', result.error);
        setMembers([]);
      }
    } catch (error) {
      console.error('Family members loading exception:', error);
      setMembers([]);
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
      console.error('User info loading failed:', error);
    }
  };

  // 가족방 탈퇴
  const leaveFamily = async () => {
    Alert.alert(
      t('family.leaveFamily'),
      t('family.leaveFamilyConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('family.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FamilyMembersService.leaveFamily(familyId);
              if (result.success) {
                Alert.alert(
                  t('family.leaveComplete'),
                  t('family.leaveSuccess'),
                  [
                    {
                      text: t('common.confirm'),
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
                Alert.alert(t('family.leaveFailed'), result.error || t('family.leaveError'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('family.leaveError'));
            }
          }
        }
      ]
    );
  };

  // 가족방 삭제 (방장만 가능)
  const deleteFamily = async () => {
    Alert.alert(
      t('family.deleteFamily'),
      t('family.deleteFamilyConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FamilyService.deleteFamily(familyId);
              if (result.success) {
                Alert.alert(
                  t('family.deleteComplete'),
                  t('family.deleteSuccess'),
                  [
                    {
                      text: t('common.confirm'),
                      onPress: async () => {
                        // 가족 목록 새로고침
                        try {
                          const familiesResult = await FamilyService.getUserFamilies();
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
                Alert.alert(t('family.deleteFailed'), result.error || t('family.deleteError'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('family.deleteError'));
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
      loadCategories();
      loadLedgerEntries();
      loadMembers();
    }, [familyId])
  );

  // 선택된 날짜가 변경될 때마다 가계부 데이터 다시 로드
  useEffect(() => {
    if (familyId) {
      loadLedgerEntries();
    }
  }, [selectedDate, familyId]);

  const renderLedgerItem = ({ item }: any) => {
    const category = categories.find(cat => cat.id === item.category_id);
    const userName = item.users?.nickname || t('common.user');
    const displayDate = new Date(item.date || item.created_at).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
    
    // 지출/수입 구분 (현재는 모든 금액이 지출로 가정)
    const isExpense = item.amount > 0;
    const typeText = isExpense ? t('entry.expense') : t('entry.income');
    const amountColor = isExpense ? '#FF6B6B' : '#4ECDC4';
    
    return (
      <View 
        style={styles.ledgerTableRow}
        onTouchEnd={() => navigation.navigate('LedgerDetail', { entryId: item.id })}
      >
        {/* 첫 번째 줄: 날짜 | 등록자 | 지출/수입 */}
        <View style={styles.ledgerFirstRow}>
          <Text style={styles.ledgerDateText}>{displayDate}</Text>
          <Text style={styles.ledgerUserText}>{userName}</Text>
          <Text style={[styles.ledgerTypeText, { color: amountColor }]}>{typeText}</Text>
        </View>
        
        {/* 두 번째 줄: 내역 | 금액 */}
        <View style={styles.ledgerSecondRow}>
          <Text style={styles.ledgerDescriptionText} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[styles.ledgerAmountText, { color: amountColor }]}>
            {currency.symbol}{Math.abs(item.amount).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderMemberItem = ({ item }: any) => {
    // 최근 5분 이내 참여한 사용자는 "새로운 멤버"로 표시
    const isNewMember = new Date().getTime() - new Date(item.joined_at).getTime() < 5 * 60 * 1000;
    
    // 현재 사용자인지 확인
    const isCurrentUser = item.user_id === currentUserId;
    
    // 표시될 이름 결정
    const displayName = isCurrentUser 
      ? t('common.me') 
      : (item.users?.nickname || t('common.user'));
    
    return (
      <List.Item
        title={
          <View style={styles.titleContainer}>
            <Text style={styles.memberName}>{item.users?.nickname || t('common.user')}</Text>
            {isCurrentUser && (
              <Badge style={styles.currentUserBadge}>{t('common.me')}</Badge>
            )}
            {item.role === 'owner' && (
              <Badge style={styles.ownerBadgeNext}>{t('family.owner')}</Badge>
            )}
          </View>
        }
        description={item.users?.email || t('common.noEmail')}
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
              <Badge style={styles.newMemberBadge}>{t('family.newMember')}</Badge>
            )}
          </View>
        )}
        style={[
          isNewMember ? styles.newMemberItem : styles.memberItem,
          { backgroundColor: themeColors.surface.primary }
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.headerCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Title style={{ color: themeColors.text.primary }}>{family?.name || t('navigation.familyLedger')}</Title>
              <Text style={{ color: themeColors.text.secondary }}>{family?.description || ''}</Text>
            </View>
            {selectedTab === 'ledger' && (
              <Button
                mode="outlined"
                icon="chart-line"
                onPress={() => navigation.navigate('Stats', { familyId })}
                style={styles.headerStatsButton}
                compact
                labelStyle={styles.headerStatsButtonLabel}
              >
                {t('common.statistics')}
              </Button>
            )}
          </View>
          {selectedTab === 'ledger' && (
            <>
              {/* 월별 네비게이션 */}
              <View style={styles.dateNavigation}>
                <IconButton
                  icon="chevron-left"
                  size={20}
                  onPress={goToPreviousMonth}
                  iconColor={themeColors.primary[500]}
                />
                <TouchableOpacity onPress={goToCurrentMonth} style={styles.dateDisplay}>
                  <Text style={[styles.selectedDateText, { color: themeColors.text.primary }]}>
                    {getSelectedDateString()}
                  </Text>
                </TouchableOpacity>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={goToNextMonth}
                  iconColor={themeColors.primary[500]}
                />
              </View>
              
              <View style={styles.statsTextContainer}>
                <Text style={[styles.summaryText, { color: themeColors.text.secondary }]}>
                  {t('entry.income')}: <Text style={{ color: '#4CAF50' }}>{currency.symbol}{totalIncome.toLocaleString()}</Text>
                  {'  '}{t('entry.expense')}: <Text style={{ color: '#FF6B6B' }}>{currency.symbol}{totalExpense.toLocaleString()}</Text>
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <View style={styles.tabContainer}>
        <Button
          mode={selectedTab === 'ledger' ? 'contained' : 'outlined'}
          onPress={() => {
            setSelectedTab('ledger');
          }}
          style={[styles.tabButton, selectedTab === 'ledger' && styles.activeTab]}
        >
          {t('navigation.familyLedger')}
        </Button>
        <Button
          mode={selectedTab === 'members' ? 'contained' : 'outlined'}
          onPress={() => {
            setSelectedTab('members');
          }}
          style={[styles.tabButton, selectedTab === 'members' && styles.activeTab]}
        >
          {t('family.members')}
        </Button>
      </View>

      <Card style={[styles.contentCard, { backgroundColor: themeColors.surface.primary }]}>
        <View style={styles.cardContentStyle}>
          {selectedTab === 'ledger' ? (
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>{t('common.loading')}...</Text>
              </View>
            ) : (
              <>
                {console.log('Rendering FlatList with', ledgerEntries.length, 'entries')}
                <FlatList
                  data={ledgerEntries}
                  renderItem={renderLedgerItem}
                  keyExtractor={(item) => item.id}
                  onRefresh={loadLedgerEntries}
                  refreshing={loading}
                  style={styles.ledgerList}
                  ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                      {t('family.noLedgerEntries')}
                    </Text>
                  }
                />
              </>
            )
          ) : (
            membersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>{t('common.loading')}...</Text>
              </View>
            ) : (
              <View style={styles.membersContainer}>
                <View style={styles.memberHeader}>
                  <Text style={[styles.memberTitle, { color: themeColors.text.primary }]}>
                    {t('family.familyMembers')} ({members.length}{t('family.membersUnit')})
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
                        {t('family.invite')}
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
                        {t('common.delete')}
                      </Button>
                    </View>
                  ) : (
                    <Button
                      mode="outlined"
                      icon="exit-to-app"
                      onPress={leaveFamily}
                      style={[styles.leaveButton, { borderColor: themeColors.error.primary }]}
                      compact
                      buttonColor="transparent"
                      textColor={themeColors.error.primary}
                      contentStyle={{ height: 36 }}
                      labelStyle={{ fontSize: 14, fontWeight: '600' }}
                    >
                      {t('family.leave')}
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
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                      {t('family.noMembers')}
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
          onPress={() => navigation.navigate('AddEntry', { familyId })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: spacing[4],
    marginBottom: spacing[1], // 하단 마진 더 줄임 (4px)
    borderRadius: 24,
    ...shadows.medium,
    overflow: 'hidden',
    minHeight: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  titleContainer: {
    flex: 1,
  },
  statsTextContainer: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    minHeight: 50,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  statsLabel: {
    ...textStyles.body2,
    fontWeight: '500',
  },
  statsValue: {
    ...textStyles.body1,
    fontWeight: 'bold',
  },
  summaryText: {
    ...textStyles.body1,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  totalAmountText: {
    ...textStyles.body1,
    fontWeight: '600',
    color: colors.secondary[500],
    lineHeight: 24,
    minHeight: 24,
  },
  headerStatsButton: {
    borderColor: colors.accent[500],
    borderRadius: spacing[3],
    alignSelf: 'flex-start',
    minWidth: 80,
    paddingHorizontal: spacing[2],
  },
  headerStatsButtonLabel: {
    fontSize: 12,
    marginHorizontal: spacing[1],
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4], // 좌우 패딩 줄임 (20px → 16px)
    marginBottom: spacing[1], // 하단 마진 줄임 (8px → 4px)
    marginTop: 0, // 상단 마진 제거
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
    marginBottom: spacing[2],
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
    paddingTop: spacing[3], // 상단 여백 줄임 (12px)
    paddingBottom: spacing[2], // 하단 여백 줄임 (8px)
    marginBottom: spacing[2], // 마진 줄임 (8px)
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    minHeight: 50, // 높이 줄임
    overflow: 'visible',
    flex: 0,
  },
  memberTitle: {
    fontSize: 18,
    fontWeight: '500',
    minHeight: 22, // 최소 높이 줄임
    lineHeight: 22, // lineHeight 줄임
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 2, // 수직 패딩 줄임
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
    alignItems: 'center',
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
    minHeight: 400,
  },
  ledgerList: {
    flex: 1,
    minHeight: 400,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ownerBadgeNext: {
    backgroundColor: colors.primary[500],
  },
  currentUserBadge: {
    backgroundColor: colors.accent[500],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ownerBadgeNext: {
    backgroundColor: colors.primary[500],
  },
  ledgerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  ledgerDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 50,
  },
  ledgerDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  ledgerDescriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  ledgerUser: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  ledgerType: {
    fontSize: 14,
    fontWeight: '600',
  },
  ledgerTableRow: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  ledgerFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  ledgerSecondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  ledgerUserText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  ledgerTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ledgerDescriptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing[3],
  },
  ledgerAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ledgerCategoryChip: {
    marginLeft: spacing[2],
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});