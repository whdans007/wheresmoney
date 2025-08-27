import { supabase } from './supabase';
import { Database } from './supabase';
import { decode } from 'base64-arraybuffer';

type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row'];
type LedgerInsert = Database['public']['Tables']['ledger_entries']['Insert'];
type LedgerUpdate = Database['public']['Tables']['ledger_entries']['Update'];

export interface CreateLedgerEntryData {
  familyId: string;
  amount: number;
  categoryId: string;
  description: string;
  imageUri: string;
  date?: string;
}

export class LedgerService {
  // 이미지를 Supabase Storage에 업로드
  static async uploadImage(imageUri: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const { data, error } = await supabase.storage
        .from('ledger-photos')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('이미지 업로드 오류:', error);
        return { success: false, error: error.message };
      }

      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('ledger-photos')
        .getPublicUrl(data.path);

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('이미지 업로드 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가계부 항목 생성
  static async createLedgerEntry(entryData: CreateLedgerEntryData): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 1. 이미지 업로드
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${entryData.familyId}/${timestamp}.jpg`;
      
      const uploadResult = await this.uploadImage(entryData.imageUri, fileName);
      if (!uploadResult.success || !uploadResult.url) {
        return { success: false, error: uploadResult.error || '이미지 업로드에 실패했습니다.' };
      }

      // 2. 가계부 항목 생성
      const ledgerData: LedgerInsert = {
        family_id: entryData.familyId,
        user_id: user.id,
        amount: entryData.amount,
        category_id: entryData.categoryId,
        description: entryData.description,
        photo_url: uploadResult.url,
        date: entryData.date || new Date().toISOString().split('T')[0],
      };

      const { data: entry, error: insertError } = await supabase
        .from('ledger_entries')
        .insert(ledgerData)
        .select()
        .single();

      if (insertError) {
        console.error('가계부 저장 오류:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, entry };
    } catch (error: any) {
      console.error('가계부 생성 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 특정 가계부 항목 조회
  static async getLedgerEntry(entryId: string): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    try {
      const { data: entry, error } = await supabase
        .from('ledger_entries')
        .select(`
          *,
          users!inner(id, nickname, avatar_url)
        `)
        .eq('id', entryId)
        .single();

      if (error) {
        console.error('가계부 조회 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, entry };
    } catch (error: any) {
      console.error('가계부 조회 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가족의 가계부 항목들 조회
  static async getLedgerEntries(familyId: string, limit = 50, offset = 0): Promise<{ success: boolean; entries?: LedgerEntry[]; error?: string }> {
    try {
      const { data: entries, error } = await supabase
        .from('ledger_entries')
        .select(`
          *,
          users!inner(id, nickname, avatar_url)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('가계부 조회 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, entries: entries || [] };
    } catch (error: any) {
      console.error('가계부 조회 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가계부 항목 수정
  static async updateLedgerEntry(entryId: string, updateData: Partial<LedgerUpdate>): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    try {
      const { data: entry, error } = await supabase
        .from('ledger_entries')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('가계부 수정 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, entry };
    } catch (error: any) {
      console.error('가계부 수정 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가계부 항목 삭제
  static async deleteLedgerEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 삭제 전 이미지 URL 가져오기 (Storage에서도 삭제하기 위함)
      const { data: entry, error: selectError } = await supabase
        .from('ledger_entries')
        .select('photo_url')
        .eq('id', entryId)
        .single();

      if (selectError) {
        console.error('가계부 조회 오류:', selectError);
        return { success: false, error: selectError.message };
      }

      // 가계부 항목 삭제
      const { error: deleteError } = await supabase
        .from('ledger_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) {
        console.error('가계부 삭제 오류:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Storage에서 이미지 삭제 (선택적)
      if (entry?.photo_url) {
        try {
          const fileName = entry.photo_url.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('ledger-photos')
              .remove([fileName]);
          }
        } catch (storageError) {
          console.warn('Storage 이미지 삭제 실패 (무시 가능):', storageError);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('가계부 삭제 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가족의 월별 통계
  static async getMonthlyStats(familyId: string, year: number, month: number): Promise<{ 
    success: boolean; 
    totalAmount?: number; 
    categoryStats?: { category_id: string; total: number; count: number }[]; 
    error?: string;
  }> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

      const { data: entries, error } = await supabase
        .from('ledger_entries')
        .select('amount, category_id')
        .eq('family_id', familyId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('월별 통계 조회 오류:', error);
        return { success: false, error: error.message };
      }

      const totalAmount = entries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
      
      const categoryMap = new Map<string, { total: number; count: number }>();
      entries?.forEach(entry => {
        const existing = categoryMap.get(entry.category_id) || { total: 0, count: 0 };
        categoryMap.set(entry.category_id, {
          total: existing.total + entry.amount,
          count: existing.count + 1,
        });
      });

      const categoryStats = Array.from(categoryMap.entries()).map(([category_id, stats]) => ({
        category_id,
        ...stats,
      }));

      return { success: true, totalAmount, categoryStats };
    } catch (error: any) {
      console.error('월별 통계 예외:', error);
      return { success: false, error: error.message };
    }
  }
}

export default LedgerService;