import { supabase } from './supabase';
import { Database } from './supabase';

type Category = Database['public']['Tables']['ledger_categories']['Row'];

export interface CategoryData {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

export class CategoryService {
  // 초기화 상태 추적을 위한 플래그
  private static initializationInProgress = false;
  private static initialized = false;
  private static lastInitializationAttempt = 0; // 마지막 초기화 시도 타임스탬프
  private static readonly COOLDOWN_PERIOD = 30000; // 30초 쿨다운

  // 초기 카테고리 데이터 (데이터베이스에 카테고리가 없을 때 fallback으로 사용)
  private static readonly FALLBACK_EXPENSE_CATEGORIES: CategoryData[] = [
    { id: 'temp-expense-1', name: '식비', color: '#FF6B6B', icon: 'food', is_default: true },
    { id: 'temp-expense-2', name: '교통비', color: '#4ECDC4', icon: 'car', is_default: true },
    { id: 'temp-expense-3', name: '쇼핑', color: '#45B7D1', icon: 'shopping-bag', is_default: true },
    { id: 'temp-expense-4', name: '의료비', color: '#96CEB4', icon: 'medical-bag', is_default: true },
    { id: 'temp-expense-5', name: '교육', color: '#FFEAA7', icon: 'school', is_default: true },
    { id: 'temp-expense-6', name: '오락', color: '#DDA0DD', icon: 'gamepad-variant', is_default: true },
    { id: 'temp-expense-7', name: '생활용품', color: '#98D8C8', icon: 'home', is_default: true },
    { id: 'temp-expense-8', name: '기타', color: '#CDCDCD', icon: 'dots-horizontal', is_default: true },
  ];

  private static readonly FALLBACK_INCOME_CATEGORIES: CategoryData[] = [
    { id: 'temp-income-1', name: '급여', color: '#4CAF50', icon: 'cash', is_default: true },
    { id: 'temp-income-2', name: '용돈', color: '#8BC34A', icon: 'gift', is_default: true },
    { id: 'temp-income-3', name: '부업', color: '#2E7D32', icon: 'briefcase', is_default: true },
    { id: 'temp-income-4', name: '투자수익', color: '#388E3C', icon: 'trending-up', is_default: true },
    { id: 'temp-income-5', name: '기타수입', color: '#689F38', icon: 'plus-circle', is_default: true },
  ];

  private static readonly INITIAL_EXPENSE_CATEGORIES = [
    { name: '식비', color: '#FF6B6B', icon: 'food', is_default: true },
    { name: '교통비', color: '#4ECDC4', icon: 'car', is_default: true },
    { name: '쇼핑', color: '#45B7D1', icon: 'shopping-bag', is_default: true },
    { name: '의료비', color: '#96CEB4', icon: 'medical-bag', is_default: true },
    { name: '교육', color: '#FFEAA7', icon: 'school', is_default: true },
    { name: '오락', color: '#DDA0DD', icon: 'gamepad-variant', is_default: true },
    { name: '생활용품', color: '#98D8C8', icon: 'home', is_default: true },
    { name: '기타', color: '#CDCDCD', icon: 'dots-horizontal', is_default: true },
  ];

  private static readonly INITIAL_INCOME_CATEGORIES = [
    { name: '급여', color: '#4CAF50', icon: 'cash', is_default: true },
    { name: '용돈', color: '#8BC34A', icon: 'gift', is_default: true },
    { name: '부업', color: '#2E7D32', icon: 'briefcase', is_default: true },
    { name: '투자수익', color: '#388E3C', icon: 'trending-up', is_default: true },
    { name: '기타수입', color: '#689F38', icon: 'plus-circle', is_default: true },
  ];

  // 쿨다운 체크
  private static isInCooldown(): boolean {
    const now = Date.now();
    return (now - this.lastInitializationAttempt) < this.COOLDOWN_PERIOD;
  }

  // 초기 카테고리 생성 (백그라운드에서 시도, 실패해도 무시)
  private static async initializeCategories(): Promise<void> {
    // 이미 시도했거나 진행 중이거나 쿨다운 중이면 중단
    if (this.initializationInProgress || this.initialized || this.isInCooldown()) {
      return;
    }

    this.initializationInProgress = true;
    this.lastInitializationAttempt = Date.now(); // 시도 타임스탬프 기록
    
    try {
      console.log('초기 카테고리 생성 시작...');
      const allCategories = [
        ...this.INITIAL_EXPENSE_CATEGORIES,
        ...this.INITIAL_INCOME_CATEGORIES
      ];

      for (const category of allCategories) {
        await supabase
          .from('ledger_categories')
          .insert(category);
      }
      console.log('초기 카테고리 생성 완료');
      this.initialized = true;
    } catch (error) {
      console.error('초기 카테고리 생성 실패 (RLS 정책 또는 이미 존재):', error);
      // 실패해도 쿨다운 적용으로 30초간 재시도 방지
    } finally {
      this.initializationInProgress = false;
    }
  }

  // 모든 카테고리 조회 (기본 카테고리)
  static async getCategories(): Promise<{ success: boolean; categories?: CategoryData[]; error?: string }> {
    try {
      const { data: categories, error } = await supabase
        .from('ledger_categories')
        .select('*')
        .eq('is_default', true)
        .order('name');

      if (error) {
        console.error('카테고리 조회 오류:', error);
        // 오류 시 fallback 카테고리 반환
        return { success: true, categories: [...this.FALLBACK_EXPENSE_CATEGORIES] };
      }

      // 카테고리가 비어있으면 백그라운드에서 초기화 시도하고 fallback 반환
      if (!categories || categories.length === 0) {
        if (!this.initialized && !this.isInCooldown()) {
          console.log('카테고리가 비어있음, 백그라운드에서 초기화 시도...');
          this.initializeCategories(); // await 없이 백그라운드 실행
        }
        
        // fallback 카테고리 반환
        return { success: true, categories: [...this.FALLBACK_EXPENSE_CATEGORIES] };
      }

      return { success: true, categories: categories || [] };
    } catch (error: any) {
      console.error('카테고리 조회 예외:', error);
      // 예외 시 fallback 카테고리 반환
      return { success: true, categories: [...this.FALLBACK_EXPENSE_CATEGORIES] };
    }
  }

  // 수입 카테고리만 조회
  static async getIncomeCategories(): Promise<{ success: boolean; categories?: CategoryData[]; error?: string }> {
    try {
      const { data: categories, error } = await supabase
        .from('ledger_categories')
        .select('*')
        .in('name', ['급여', '용돈', '부업', '투자수익', '기타수입'])
        .eq('is_default', true)
        .order('name');

      if (error) {
        console.error('수입 카테고리 조회 오류:', error);
        // 오류 시 fallback 카테고리 반환
        return { success: true, categories: [...this.FALLBACK_INCOME_CATEGORIES] };
      }

      // 카테고리가 비어있으면 백그라운드에서 초기화 시도하고 fallback 반환
      if (!categories || categories.length === 0) {
        if (!this.initialized && !this.isInCooldown()) {
          console.log('수입 카테고리가 비어있음, 백그라운드에서 초기화 시도...');
          this.initializeCategories(); // await 없이 백그라운드 실행
        }
        
        // fallback 카테고리 반환
        return { success: true, categories: [...this.FALLBACK_INCOME_CATEGORIES] };
      }

      return { success: true, categories: categories || [] };
    } catch (error: any) {
      console.error('수입 카테고리 조회 예외:', error);
      // 예외 시 fallback 카테고리 반환
      return { success: true, categories: [...this.FALLBACK_INCOME_CATEGORIES] };
    }
  }

  // 지출 카테고리만 조회 
  static async getExpenseCategories(): Promise<{ success: boolean; categories?: CategoryData[]; error?: string }> {
    try {
      const { data: categories, error } = await supabase
        .from('ledger_categories')
        .select('*')
        .not('name', 'in', '(급여,용돈,부업,투자수익,기타수입)')
        .eq('is_default', true)
        .order('name');

      if (error) {
        console.error('지출 카테고리 조회 오류:', error);
        // 오류 시 fallback 카테고리 반환
        return { success: true, categories: [...this.FALLBACK_EXPENSE_CATEGORIES] };
      }

      // 카테고리가 비어있으면 백그라운드에서 초기화 시도하고 fallback 반환
      if (!categories || categories.length === 0) {
        if (!this.initialized && !this.isInCooldown()) {
          console.log('지출 카테고리가 비어있음, 백그라운드에서 초기화 시도...');
          this.initializeCategories(); // await 없이 백그라운드 실행
        }
        
        // fallback 카테고리 반환
        return { success: true, categories: [...this.FALLBACK_EXPENSE_CATEGORIES] };
      }

      return { success: true, categories: categories || [] };
    } catch (error: any) {
      console.error('지출 카테고리 조회 예외:', error);
      // 예외 시 fallback 카테고리 반환
      return { success: true, categories: [...this.FALLBACK_EXPENSE_CATEGORIES] };
    }
  }

  // 특정 카테고리 조회
  static async getCategoryById(categoryId: string): Promise<{ success: boolean; category?: CategoryData; error?: string }> {
    try {
      const { data: category, error } = await supabase
        .from('ledger_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        console.error('카테고리 조회 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, category };
    } catch (error: any) {
      console.error('카테고리 조회 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 카테고리 생성 (관리자용 - 추후 확장)
  static async createCategory(categoryData: Omit<CategoryData, 'id'>): Promise<{ success: boolean; category?: CategoryData; error?: string }> {
    try {
      const { data: category, error } = await supabase
        .from('ledger_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error('카테고리 생성 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, category };
    } catch (error: any) {
      console.error('카테고리 생성 예외:', error);
      return { success: false, error: error.message };
    }
  }
}

export default CategoryService;