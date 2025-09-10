import { supabase } from './supabase';
import { Database } from './supabase';
import { decode } from 'base64-arraybuffer';
import { NotificationService } from './notification';

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
      console.log('Starting image upload:', { imageUri, fileName });
      
      // React Native에서 이미지를 FormData로 변환
      const formData = new FormData();
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      } as any;
      
      formData.append('file', imageFile);
      
      console.log('FormData prepared, uploading to Supabase...');
      
      const { data, error } = await supabase.storage
        .from('ledger-photos')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase 업로드 오류:', error);
        return { success: false, error: error.message };
      }

      console.log('Upload successful:', data);

      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('ledger-photos')
        .getPublicUrl(data.path);

      console.log('Public URL generated:', publicUrl);
      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('이미지 업로드 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가계부 항목 생성
  static async createLedgerEntry(entryData: CreateLedgerEntryData): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    try {
      console.log('Creating ledger entry with data:', entryData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return { success: false, error: '로그인이 필요합니다.' };
      }

      console.log('User authenticated:', user.id);

      // 지출 카테고리에 대해서만 임시 카테고리 ID 체크
      if (entryData.amount > 0 && entryData.categoryId.startsWith('temp-')) {
        return { 
          success: false, 
          error: '카테고리 정보를 불러오고 있습니다. 잠시 후 다시 시도해주세요.' 
        };
      }

      // 수입 카테고리 ID 처리 (income-* 형태는 null로 저장)
      const categoryId = entryData.categoryId.startsWith('income-') ? null : entryData.categoryId;

      // 1. 이미지 업로드 (수입의 경우 선택사항)
      let photoUrl = null;
      
      if (entryData.imageUri) {
        const timestamp = new Date().getTime();
        const fileName = `${user.id}/${entryData.familyId}/${timestamp}.jpg`;
        
        console.log('Starting image upload with fileName:', fileName);
        const uploadResult = await this.uploadImage(entryData.imageUri, fileName);
        
        if (!uploadResult.success || !uploadResult.url) {
          console.error('Image upload failed:', uploadResult.error);
          return { success: false, error: uploadResult.error || '이미지 업로드에 실패했습니다.' };
        }

        photoUrl = uploadResult.url;
        console.log('Image upload successful, URL:', uploadResult.url);
      } else {
        console.log('No image provided, using null for photo_url');
      }

      // 2. 가계부 항목 생성
      const ledgerData: LedgerInsert = {
        family_id: entryData.familyId,
        user_id: user.id,
        amount: entryData.amount,
        category_id: categoryId,
        description: entryData.description,
        photo_url: photoUrl || '', // null이면 빈 문자열로 처리
        date: entryData.date || new Date().toISOString().split('T')[0],
      };

      console.log('Inserting ledger data:', ledgerData);

      const { data: entry, error: insertError } = await supabase
        .from('ledger_entries')
        .insert(ledgerData)
        .select()
        .single();

      if (insertError) {
        console.error('가계부 저장 오류:', insertError);
        return { success: false, error: `데이터베이스 저장 실패: ${insertError.message}` };
      }

      console.log('Ledger entry created successfully:', entry);
      
      // 가계부 기록 알림 전송
      try {
        console.log('알림 전송 시도 시작...');
        // 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', user.id)
          .single();

        console.log('사용자 정보 조회 결과:', { userData, userError });

        if (!userError && userData) {
          const isIncome = entryData.amount < 0;
          console.log('알림 전송:', {
            familyId: entryData.familyId,
            userId: user.id,
            nickname: userData.nickname,
            amount: entryData.amount,
            isIncome
          });
          
          await NotificationService.notifyLedgerEntry(
            entryData.familyId,
            user.id,
            userData.nickname,
            entryData.amount,
            isIncome
          );
          
          console.log('알림 전송 완료');
        } else {
          console.log('사용자 정보가 없어서 알림 전송 건너뜀');
        }
      } catch (notificationError) {
        console.log('알림 전송 중 오류 (무시 가능):', notificationError);
      }

      return { success: true, entry };
    } catch (error: any) {
      console.error('가계부 생성 예외:', error);
      return { success: false, error: `가계부 생성 중 오류: ${error.message}` };
    }
  }

  // 특정 가계부 항목 조회
  static async getLedgerEntry(entryId: string): Promise<{ success: boolean; entry?: LedgerEntry & { users?: { id: string; nickname: string; avatar_url?: string } }; error?: string }> {
    try {
      // 1단계: 가계부 항목 조회
      const { data: entry, error: entryError } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (entryError) {
        console.error('가계부 조회 오류:', entryError);
        return { success: false, error: entryError.message };
      }

      if (!entry) {
        return { success: false, error: '가계부 항목을 찾을 수 없습니다.' };
      }

      // 2단계: 사용자 정보 별도 조회
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .eq('id', entry.user_id)
        .single();

      if (userError) {
        console.warn('사용자 정보 조회 실패:', userError);
      }

      // 3단계: 데이터 조합
      const result = {
        ...entry,
        users: user || { id: entry.user_id, nickname: '사용자', avatar_url: null }
      };

      return { success: true, entry: result };
    } catch (error: any) {
      console.error('가계부 조회 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가족의 가계부 항목들 조회
  static async getLedgerEntries(familyId: string, limit = 50, offset = 0): Promise<{ success: boolean; entries?: (LedgerEntry & { users?: { id: string; nickname: string; avatar_url?: string } })[]; error?: string }> {
    try {
      // 1단계: 가계부 항목들 조회
      const { data: entries, error: entriesError } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (entriesError) {
        console.error('가계부 조회 오류:', entriesError);
        return { success: false, error: entriesError.message };
      }

      if (!entries || entries.length === 0) {
        return { success: true, entries: [] };
      }

      // 2단계: 고유한 사용자 ID 추출
      const uniqueUserIds = [...new Set(entries.map(entry => entry.user_id))];

      // 3단계: 사용자 정보 별도 조회
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', uniqueUserIds);

      if (usersError) {
        console.warn('사용자 정보 조회 실패:', usersError);
      }

      // 4단계: 데이터 조합
      const result = entries.map(entry => {
        const user = users?.find(u => u.id === entry.user_id);
        return {
          ...entry,
          users: user || { id: entry.user_id, nickname: '사용자', avatar_url: null }
        };
      });

      return { success: true, entries: result };
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
      // 정확한 월말 날짜 계산
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDayOfMonth = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

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

  // 멤버별 통계
  static async getMemberStats(familyId: string, year: number, month: number): Promise<{ 
    success: boolean; 
    memberStats?: { user_id: string; nickname: string; total_expense: number; total_income: number; entry_count: number }[]; 
    error?: string;
  }> {
    try {
      // 정확한 월말 날짜 계산
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDayOfMonth = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

      // 1단계: 가계부 항목만 먼저 조회 (RLS 정책 적용)
      const { data: entries, error: entriesError } = await supabase
        .from('ledger_entries')
        .select('amount, user_id')
        .eq('family_id', familyId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (entriesError) {
        console.error('가계부 항목 조회 오류:', entriesError);
        return { success: false, error: entriesError.message };
      }

      if (!entries || entries.length === 0) {
        return { success: true, memberStats: [] };
      }

      // 2단계: 고유한 사용자 ID 추출
      const uniqueUserIds = [...new Set(entries.map(entry => entry.user_id))];

      // 3단계: 사용자 정보 별도 조회
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', uniqueUserIds);

      if (usersError) {
        console.error('사용자 정보 조회 오류:', usersError);
        return { success: false, error: usersError.message };
      }

      // 4단계: 데이터 조합 및 통계 계산
      const memberMap = new Map<string, { 
        nickname: string; 
        total_expense: number; 
        total_income: number; 
        entry_count: number 
      }>();

      entries.forEach(entry => {
        const userId = entry.user_id;
        const user = users?.find(u => u.id === userId);
        const nickname = user?.nickname || '사용자';
        
        const existing = memberMap.get(userId) || { 
          nickname, 
          total_expense: 0, 
          total_income: 0, 
          entry_count: 0 
        };

        if (entry.amount > 0) {
          existing.total_expense += entry.amount;
        } else {
          existing.total_income += Math.abs(entry.amount);
        }
        existing.entry_count += 1;

        memberMap.set(userId, existing);
      });

      const memberStats = Array.from(memberMap.entries()).map(([user_id, stats]) => ({
        user_id,
        ...stats,
      }));

      return { success: true, memberStats };
    } catch (error: any) {
      console.error('멤버별 통계 예외:', error);
      return { success: false, error: error.message };
    }
  }
}

export default LedgerService;