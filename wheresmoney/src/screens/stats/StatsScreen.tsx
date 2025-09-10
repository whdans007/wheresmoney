import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  Paragraph,
  Chip,
  Divider,
  ActivityIndicator,
  IconButton
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { useFamilyStore } from '../../stores/familyStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';

type StatsScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Stats'>;
type StatsScreenRouteProp = RouteProp<HomeStackParamList, 'Stats'>;

interface Props {
  navigation: StatsScreenNavigationProp;
  route: StatsScreenRouteProp;
}

interface MonthlyStats {
  month: string;
  total: number;
  categories: { [key: string]: number };
}

interface CategoryStats {
  name: string;
  amount: number;
  color: string;
  population: number;
  legendFontColor: string;
  legendFontSize: number;
}

interface MemberStats {
  user_id: string;
  nickname: string;
  total_expense: number;
  total_income: number;
  entry_count: number;
}

export default function StatsScreen({ navigation, route }: Props) {
  const { familyId } = route.params;
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date()); // 선택된 년월
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { families } = useFamilyStore();
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
    return `${year}년 ${month}월`;
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const months = selectedPeriod === 'month' ? 1 : selectedPeriod === 'quarter' ? 3 : 12;
      
      // selectedDate를 기준으로 시작 날짜 계산
      const baseDate = selectedPeriod === 'month' ? selectedDate : new Date(); // 월별일 때만 선택된 날짜 사용
      const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - months + 1, 1);
      
      // 월별 통계 로드
      const monthlyData: MonthlyStats[] = [];
      let totalAmount = 0;
      const categoryTotals: { [key: string]: number } = {};

      for (let i = 0; i < months; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const result = await LedgerService.getMonthlyStats(familyId, year, month);
        
        if (result.success && result.totalAmount !== undefined) {
          const monthStats: MonthlyStats = {
            month: `${year}-${month.toString().padStart(2, '0')}`,
            total: result.totalAmount,
            categories: {}
          };
          
          monthlyData.push(monthStats);
          totalAmount += result.totalAmount;
          
          // 카테고리별 누적
          if (result.categoryStats) {
            result.categoryStats.forEach(stat => {
              categoryTotals[stat.category_id] = (categoryTotals[stat.category_id] || 0) + stat.total;
            });
          }
        } else {
          monthlyData.push({
            month: `${year}-${month.toString().padStart(2, '0')}`,
            total: 0,
            categories: {}
          });
        }
      }

      setMonthlyStats(monthlyData);
      setTotalExpenses(totalAmount);

      // 카테고리 통계 생성
      const categoryStatsData: CategoryStats[] = [];
      Object.entries(categoryTotals).forEach(([categoryId, amount]) => {
        const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
        if (category && amount > 0) {
          categoryStatsData.push({
            name: category.name,
            amount: amount,
            color: category.color,
            population: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
            legendFontColor: isDarkMode ? '#ffffff' : '#333',
            legendFontSize: 12,
          });
        }
      });

      // 금액 순으로 정렬
      categoryStatsData.sort((a, b) => b.amount - a.amount);
      setCategoryStats(categoryStatsData);

      // 멤버별 통계 로드
      const memberStatsData: MemberStats[] = [];
      for (let i = 0; i < months; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const memberResult = await LedgerService.getMemberStats(familyId, year, month);
        
        if (memberResult.success && memberResult.memberStats) {
          memberResult.memberStats.forEach(memberStat => {
            const existingMember = memberStatsData.find(m => m.user_id === memberStat.user_id);
            if (existingMember) {
              existingMember.total_expense += memberStat.total_expense;
              existingMember.total_income += memberStat.total_income;
              existingMember.entry_count += memberStat.entry_count;
            } else {
              memberStatsData.push({ ...memberStat });
            }
          });
        }
      }

      // 지출 금액 순으로 정렬
      memberStatsData.sort((a, b) => b.total_expense - a.total_expense);
      setMemberStats(memberStatsData);

    } catch (error) {
      console.log('Load stats error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, selectedDate, familyId]);

  const screenWidth = Dimensions.get('window').width;
  
  const chartConfig = {
    backgroundColor: themeColors.surface.primary,
    backgroundGradientFrom: themeColors.surface.primary,
    backgroundGradientTo: themeColors.surface.secondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDarkMode ? '156, 204, 101' : '98, 0, 238'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: isDarkMode ? '#9cc465' : '#6200EE'
    }
  };

  const barData = {
    labels: monthlyStats.map(stat => stat.month.split('-')[1] + '월'),
    datasets: [
      {
        data: monthlyStats.map(stat => stat.total)
      }
    ]
  };

  const lineData = {
    labels: monthlyStats.map(stat => stat.month.split('-')[1] + '월'),
    datasets: [
      {
        data: monthlyStats.map(stat => stat.total),
        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const periodLabels = {
    month: '이번 달',
    quarter: '최근 3개월',
    year: '올해'
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background.secondary }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>통계 로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.headerCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={{ color: themeColors.text.primary }}>{family?.name || '가족방'} 통계</Title>
        </Card.Content>
      </Card>

      <View style={styles.periodSelector}>
        {(['month', 'quarter', 'year'] as const).map((period) => (
          <Chip
            key={period}
            selected={selectedPeriod === period}
            onPress={() => setSelectedPeriod(period)}
            style={[
              styles.periodChip,
              selectedPeriod === period && styles.selectedChip
            ]}
          >
            {periodLabels[period]}
          </Chip>
        ))}
      </View>

      {/* 월별 네비게이션 (월별 선택 시에만 표시) */}
      {selectedPeriod === 'month' && (
        <Card style={[styles.dateNavigationCard, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <View style={styles.dateNavigation}>
              <IconButton
                icon="chevron-left"
                size={24}
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
                size={24}
                onPress={goToNextMonth}
                iconColor={themeColors.primary[500]}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={[styles.summaryCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={[styles.totalAmount, { color: themeColors.primary[500] }]}>
            총 지출: {totalExpenses.toLocaleString()}원
          </Title>
        </Card.Content>
      </Card>

      {/* 멤버별 지출/수입 - 총 지출 다음에 표시 */}
      {memberStats.length > 0 && (
        <Card style={[styles.chartCard, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: themeColors.text.primary }]}>멤버별 지출/수입</Title>
            <View style={styles.memberStatsList}>
              {memberStats.map((member, index) => (
                <View key={member.user_id} style={[styles.memberStatItem, { backgroundColor: themeColors.surface.secondary }]}>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: themeColors.text.primary }]}>{member.nickname}</Text>
                    <Text style={[styles.memberEntryCount, { color: themeColors.text.secondary }]}>
                      {member.entry_count}건
                    </Text>
                  </View>
                  <View style={styles.memberAmounts}>
                    <View style={styles.amountRow}>
                      <Text style={[styles.expenseLabel, { color: themeColors.text.secondary }]}>지출</Text>
                      <Text style={[styles.amountValue, styles.expenseAmount]}>
                        {member.total_expense.toLocaleString()}원
                      </Text>
                    </View>
                    {member.total_income > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={[styles.incomeLabel, { color: themeColors.text.secondary }]}>수입</Text>
                        <Text style={[styles.amountValue, styles.incomeAmount]}>
                          {member.total_income.toLocaleString()}원
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {monthlyStats.length > 0 && monthlyStats.some(stat => stat.total > 0) && (
        <>
          <Card style={[styles.chartCard, { backgroundColor: themeColors.surface.primary }]}>
            <Card.Content>
              <Title style={[styles.chartTitle, { color: themeColors.text.primary }]}>월별 지출 추이</Title>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={lineData}
                  width={Math.max(screenWidth - 80, monthlyStats.length * 80)}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  formatYLabel={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
              </ScrollView>
            </Card.Content>
          </Card>

          <Card style={[styles.chartCard, { backgroundColor: themeColors.surface.primary }]}>
            <Card.Content>
              <Title style={[styles.chartTitle, { color: themeColors.text.primary }]}>월별 지출 비교</Title>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={barData}
                  width={Math.max(screenWidth - 80, monthlyStats.length * 80)}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  formatYLabel={(value) => `${Math.round(Number(value) / 1000)}k`}
                  showValuesOnTopOfBars
                />
              </ScrollView>
            </Card.Content>
          </Card>
        </>
      )}

      {categoryStats.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: themeColors.text.primary }]}>카테고리별 지출</Title>
            <PieChart
              data={categoryStats}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
            <Divider style={styles.divider} />
            <View style={styles.categoryList}>
              {categoryStats.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View 
                      style={[
                        styles.categoryColor, 
                        { backgroundColor: category.color }
                      ]} 
                    />
                    <Text style={[styles.categoryName, { color: themeColors.text.primary }]}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={[styles.amountText, { color: themeColors.text.primary }]}>
                      {category.amount.toLocaleString()}원
                    </Text>
                    <Text style={[styles.percentText, { color: themeColors.text.secondary }]}>
                      ({category.population}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}


      {totalExpenses === 0 && (
        <Card style={[styles.emptyCard, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
              선택한 기간에 지출 내역이 없습니다.{'\n'}
              가계부를 작성해보세요!
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  periodChip: {
    flex: 1,
  },
  selectedChip: {
    backgroundColor: '#6200EE',
  },
  dateNavigationCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  currentMonthHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  totalAmount: {
    textAlign: 'center',
  },
  periodText: {
    textAlign: 'center',
    marginTop: 4,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
  },
  divider: {
    marginVertical: 16,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    flex: 1,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  percentText: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  memberStatsList: {
    gap: 12,
  },
  memberStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberEntryCount: {
    fontSize: 12,
    marginTop: 2,
  },
  memberAmounts: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseLabel: {
    fontSize: 12,
    minWidth: 30,
  },
  incomeLabel: {
    fontSize: 12,
    minWidth: 30,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'right',
  },
  expenseAmount: {
    color: '#FF6B6B',
  },
  incomeAmount: {
    color: '#4ECDC4',
  },
});