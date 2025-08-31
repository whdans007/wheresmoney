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
        return { success: false, error: error.message };
      }

      return { success: true, categories: categories || [] };
    } catch (error: any) {
      console.error('카테고리 조회 예외:', error);
      return { success: false, error: error.message };
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