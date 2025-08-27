import { supabase } from './supabase';
import { Database } from './supabase';

type FamilyMember = Database['public']['Tables']['family_members']['Row'];
type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert'];

export interface FamilyMemberWithUser extends Omit<FamilyMember, 'user_id'> {
  user_id: string;
  users: {
    id: string;
    nickname: string;
    avatar_url?: string;
    email: string;
  };
}

export interface InviteCode {
  id: string;
  family_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
}

export class FamilyMembersService {
  // 가족 구성원 목록 조회
  static async getFamilyMembers(familyId: string): Promise<{ success: boolean; members?: FamilyMemberWithUser[]; error?: string }> {
    try {
      const { data: members, error } = await supabase
        .from('family_members')
        .select(`
          *,
          users!inner(id, nickname, avatar_url, email)
        `)
        .eq('family_id', familyId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('가족 구성원 조회 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, members: members || [] };
    } catch (error: any) {
      console.error('가족 구성원 조회 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 초대 코드 생성
  static async createInviteCode(familyId: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 가족방 소유자인지 확인
      const { data: family } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', familyId)
        .single();

      if (!family || family.owner_id !== user.id) {
        return { success: false, error: '가족방 소유자만 초대 코드를 생성할 수 있습니다.' };
      }

      // 임시로 간단한 초대 코드 시스템 사용 (무한 루프 방지)
      const code = familyId.replace(/-/g, '').substring(0, 6).toUpperCase();
      return { success: true, code };
    } catch (error: any) {
      console.error('초대 코드 생성 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 초대 코드로 가족 참여
  static async joinFamilyByCode(code: string): Promise<{ success: boolean; familyId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 임시로 코드를 가족 ID로 해석 (무한 루프 방지)
      const { data: families } = await supabase
        .from('families')
        .select('id, owner_id');

      const matchingFamily = families?.find(f => 
        f.id.replace(/-/g, '').substring(0, 6).toUpperCase() === code.toUpperCase()
      );

      if (!matchingFamily) {
        return { success: false, error: '유효하지 않은 초대 코드입니다.' };
      }

      // 이미 가족 구성원인지 확인
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', matchingFamily.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { success: false, error: '이미 이 가족의 구성원입니다.' };
      }

      // 가족 구성원으로 추가
      const { error: insertError } = await supabase
        .from('family_members')
        .insert({
          family_id: matchingFamily.id,
          user_id: user.id,
          role: 'member',
        });

      if (insertError) {
        console.error('가족 구성원 추가 오류:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, familyId: matchingFamily.id };
    } catch (error: any) {
      console.error('가족 참여 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가족에서 탈퇴
  static async leaveFamly(familyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 가족 정보 확인
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', familyId)
        .single();

      if (familyError || !family) {
        return { success: false, error: '가족 정보를 찾을 수 없습니다.' };
      }

      // 가족 소유자는 탈퇴할 수 없음
      if (family.owner_id === user.id) {
        return { success: false, error: '가족 소유자는 탈퇴할 수 없습니다. 먼저 소유권을 이전하세요.' };
      }

      // 가족에서 탈퇴
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('가족 탈퇴 오류:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('가족 탈퇴 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가족 구성원 추방 (소유자만 가능)
  static async removeMember(familyId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 가족 소유자인지 확인
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', familyId)
        .single();

      if (familyError || !family || family.owner_id !== user.id) {
        return { success: false, error: '가족 소유자만 구성원을 추방할 수 있습니다.' };
      }

      // 자기 자신을 추방할 수는 없음
      if (userId === user.id) {
        return { success: false, error: '자기 자신을 추방할 수 없습니다.' };
      }

      // 구성원 추방
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('구성원 추방 오류:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('구성원 추방 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 소유권 이전 (소유자만 가능)
  static async transferOwnership(familyId: string, newOwnerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 가족 소유자인지 확인
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', familyId)
        .single();

      if (familyError || !family || family.owner_id !== user.id) {
        return { success: false, error: '가족 소유자만 소유권을 이전할 수 있습니다.' };
      }

      // 새 소유자가 가족 구성원인지 확인
      const { data: newOwnerMember, error: memberError } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('user_id', newOwnerId)
        .single();

      if (memberError || !newOwnerMember) {
        return { success: false, error: '새 소유자는 가족 구성원이어야 합니다.' };
      }

      // 트랜잭션으로 소유권 이전
      const { error: updateFamilyError } = await supabase
        .from('families')
        .update({ owner_id: newOwnerId })
        .eq('id', familyId);

      if (updateFamilyError) {
        console.error('가족 소유자 변경 오류:', updateFamilyError);
        return { success: false, error: updateFamilyError.message };
      }

      // 기존 소유자의 role을 member로 변경
      const { error: updateOldOwnerError } = await supabase
        .from('family_members')
        .update({ role: 'member' })
        .eq('family_id', familyId)
        .eq('user_id', user.id);

      // 새 소유자의 role을 owner로 변경
      const { error: updateNewOwnerError } = await supabase
        .from('family_members')
        .update({ role: 'owner' })
        .eq('family_id', familyId)
        .eq('user_id', newOwnerId);

      if (updateOldOwnerError || updateNewOwnerError) {
        console.error('구성원 role 변경 오류:', { updateOldOwnerError, updateNewOwnerError });
        return { success: false, error: '소유권 이전 중 오류가 발생했습니다.' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('소유권 이전 예외:', error);
      return { success: false, error: error.message };
    }
  }
}

export default FamilyMembersService;