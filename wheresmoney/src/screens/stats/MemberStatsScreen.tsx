import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Text, 
  Card,
  Title,
  ActivityIndicator
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors, darkColors } from '../../theme';

type MemberStatsNavigationProp = StackNavigationProp<HomeStackParamList, 'MemberStats'>;
type MemberStatsRouteProp = RouteProp<HomeStackParamList, 'MemberStats'>;

interface Props {
  navigation: MemberStatsNavigationProp;
  route: MemberStatsRouteProp;
}

interface MonthlyMemberStats {
  month: string;
  total_expense: number;
  total_income: number;
  entry_count: number;
}

export default function MemberStatsScreen({ navigation, route }: Props) {
  const { familyId, memberId, memberName } = route.params;
  const { isDarkMode } = useSettingsStore();
  const themeColors = isDarkMode ? darkColors : colors;
  const [monthlyStats, setMonthlyStats] = useState<MonthlyMemberStats[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 현재 날짜 기준으로 고정
  const currentDate = new Date();

  const loadMemberStats = async () => {
    setLoading(true);
    try {
      // 최근 12개월 데이터 가져오기
      const months = 12;
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months + 1, 1);
      
      const monthlyData: MonthlyMemberStats[] = [];

      for (let i = 0; i < months; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const result = await LedgerService.getMemberStats(familyId, year, month);
        
        if (result.success && result.memberStats) {
          const memberStat = result.memberStats.find(stat => stat.user_id === memberId);
          if (memberStat) {
            monthlyData.push({
              month: `${year}-${month.toString().padStart(2, '0')}`,
              total_expense: memberStat.total_expense,
              total_income: memberStat.total_income,
              entry_count: memberStat.entry_count,
            });
          } else {
            monthlyData.push({
              month: `${year}-${month.toString().padStart(2, '0')}`,
              total_expense: 0,
              total_income: 0,
              entry_count: 0,
            });
          }
        } else {
          monthlyData.push({
            month: `${year}-${month.toString().padStart(2, '0')}`,
            total_expense: 0,
            total_income: 0,
            entry_count: 0,
          });
        }
      }

      setMonthlyStats(monthlyData);
      
      // 데이터 로딩 후 자동으로 최신 데이터(우측 끝)로 스크롤
      setTimeout(() => {
        if (scrollViewRef.current && monthlyData.length > 0) {
          const chartWidth = Math.max(screenWidth - 80, monthlyData.length * 80);
          const scrollToX = chartWidth - (screenWidth - 80);
          scrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
        }
      }, 100);
    } catch (error) {
      console.log('Load member stats error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMemberStats();
  }, [familyId, memberId]);

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
  };

  const expenseData = {
    labels: monthlyStats.map(stat => {
      const [year, month] = stat.month.split('-');
      const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
      return monthNames[parseInt(month) - 1];
    }),
    datasets: [
      {
        data: monthlyStats.map(stat => stat.total_expense)
      }
    ]
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background.secondary }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>{memberName} 통계 로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <Card style={[styles.headerCard, { backgroundColor: themeColors.surface.primary }]}>
        <Card.Content>
          <Title style={{ color: themeColors.text.primary }}>{memberName}님의 지출 통계</Title>
        </Card.Content>
      </Card>


      {/* 월별 지출 차트 */}
      {monthlyStats.length > 0 && monthlyStats.some(stat => stat.total_expense > 0) && (
        <Card style={[styles.chartCard, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: themeColors.text.primary }]}>
              월별 지출 추이 <Text style={[styles.scrollHint, { color: themeColors.text.tertiary }]}>(좌우 스크롤)</Text>
            </Title>
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
            >
              <BarChart
                data={expenseData}
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
      )}

      {/* 월별 상세 정보 */}
      {monthlyStats.length > 0 && (
        <Card style={[styles.chartCard, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: themeColors.text.primary }]}>월별 상세 내역</Title>
            <View style={styles.monthlyDetailsList}>
              {monthlyStats.filter(stat => stat.total_expense > 0 || stat.entry_count > 0).map((stat, index) => {
                const [year, month] = stat.month.split('-');
                const monthName = `${year}년 ${parseInt(month)}월`;
                
                return (
                  <View key={index} style={[styles.monthlyDetailItem, { backgroundColor: themeColors.surface.secondary }]}>
                    <View style={styles.monthInfo}>
                      <Text style={[styles.monthName, { color: themeColors.text.primary }]}>{monthName}</Text>
                      <Text style={[styles.entryCount, { color: themeColors.text.secondary }]}>
                        {stat.entry_count}건
                      </Text>
                    </View>
                    <View style={styles.monthAmounts}>
                      <Text style={[styles.expenseAmount, { color: themeColors.error }]}>
                        지출: {stat.total_expense.toLocaleString()}원
                      </Text>
                      {stat.total_income > 0 && (
                        <Text style={[styles.incomeAmount, { color: themeColors.success }]}>
                          수입: {stat.total_income.toLocaleString()}원
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      )}

      {monthlyStats.every(stat => stat.total_expense === 0 && stat.entry_count === 0) && (
        <Card style={[styles.emptyCard, { backgroundColor: themeColors.surface.primary }]}>
          <Card.Content>
            <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
              {memberName}님의 지출 내역이 없습니다.
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
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  scrollHint: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  chart: {
    borderRadius: 16,
  },
  monthlyDetailsList: {
    gap: 8,
  },
  monthlyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  entryCount: {
    fontSize: 12,
  },
  monthAmounts: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 32,
  },
});