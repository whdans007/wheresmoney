import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Text, 
  Button, 
  Card,
  Title,
  Paragraph,
  Chip,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { HomeStackParamList } from '../../types';
import { LedgerService } from '../../services/ledger';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { useFamilyStore } from '../../stores/familyStore';

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

export default function StatsScreen({ navigation, route }: Props) {
  const { familyId } = route.params;
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { families } = useFamilyStore();
  const family = families.find(f => f.id === familyId);

  const loadStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const months = selectedPeriod === 'month' ? 1 : selectedPeriod === 'quarter' ? 3 : 12;
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      
      // 월별 통계 로드
      const monthlyData: MonthlyStats[] = [];
      let totalAmount = 0;
      const categoryTotals: { [key: string]: number } = {};

      for (let i = 0; i < months; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const result = await LedgerService.getMonthlyStats(familyId, year, month);
        
        if (result.success && result.stats) {
          const monthStats: MonthlyStats = {
            month: `${year}-${month.toString().padStart(2, '0')}`,
            total: result.stats.totalAmount,
            categories: result.stats.categoryBreakdown
          };
          
          monthlyData.push(monthStats);
          totalAmount += result.stats.totalAmount;
          
          // 카테고리별 누적
          Object.entries(result.stats.categoryBreakdown).forEach(([categoryId, amount]) => {
            categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + amount;
          });
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
            legendFontColor: '#333',
            legendFontSize: 12,
          });
        }
      });

      // 금액 순으로 정렬
      categoryStatsData.sort((a, b) => b.amount - a.amount);
      setCategoryStats(categoryStatsData);

    } catch (error) {
      console.log('Load stats error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, familyId]);

  const screenWidth = Dimensions.get('window').width;
  
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6200EE'
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>통계 로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>{family?.name || '가족방'} 통계</Title>
          <Paragraph>가계부 지출 분석 및 통계입니다.</Paragraph>
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

      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.totalAmount}>
            총 지출: {totalExpenses.toLocaleString()}원
          </Title>
          <Text style={styles.periodText}>
            ({periodLabels[selectedPeriod]} 기준)
          </Text>
        </Card.Content>
      </Card>

      {monthlyStats.length > 0 && monthlyStats.some(stat => stat.total > 0) && (
        <>
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>월별 지출 추이</Title>
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

          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>월별 지출 비교</Title>
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
            <Title style={styles.chartTitle}>카테고리별 지출</Title>
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
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={styles.amountText}>
                      {category.amount.toLocaleString()}원
                    </Text>
                    <Text style={styles.percentText}>
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
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
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
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  totalAmount: {
    color: '#2196F3',
    textAlign: 'center',
  },
  periodText: {
    textAlign: 'center',
    color: '#666',
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
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});