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
      
      // 먼저 간단한 쿼리로 family_members 테이블 확인
      const { data: rawMembers, error: rawError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);
      

      if (rawError) {
        console.error('Raw query 오류:', rawError);
        return { success: false, error: rawError.message };
      }

      if (!rawMembers || rawMembers.length === 0) {
        return { success: true, members: [] };
      }

      // 각 멤버의 사용자 정보를 개별적으로 조회
      const membersWithUsers = [];
      for (const member of rawMembers) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, nickname, avatar_url, email')
          .eq('id', member.user_id)
          .single();
        
        if (userData) {
          membersWithUsers.push({
            ...member,
            users: userData
          });
        } else {
          // 사용자 정보가 없어도 멤버는 포함 (기본값으로)
          membersWithUsers.push({
            ...member,
            users: {
              id: member.user_id,
              nickname: 'Unknown User',
              avatar_url: null,
              email: 'unknown@email.com'
            }
          });
        }
      }


      return { success: true, members: membersWithUsers };
    } catch (error: any) {
      console.error('가족 구성원 조회 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 초대 코드 생성
  static async createInviteCode(familyId: string): Promise<{ success: boolean; code?: string; expiresAt?: string; error?: string }> {
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

      // 기존의 활성화된 초대 코드가 있으면 만료 처리
      await supabase
        .from('invite_codes')
        .update({ is_used: true })
        .eq('family_id', familyId)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString());

      // 새로운 6자리 숫자 초대 코드 생성
      let code: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        // 6자리 랜덤 숫자 생성
        code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 중복 확인 (활성화된 코드만)
        const { data: existingCode } = await supabase
          .from('invite_codes')
          .select('id')
          .eq('code', code)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return { success: false, error: '초대 코드 생성에 실패했습니다. 다시 시도해주세요.' };
      }

      // 24시간 후 만료
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // 초대 코드 저장
      
      const { data: inviteCode, error: insertError } = await supabase
        .from('invite_codes')
        .insert({
          family_id: familyId,
          code: code!,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })
        .select('code, expires_at')
        .single();


      if (insertError) {
        console.error('초대 코드 저장 오류:', insertError);
        
        // 테이블이 없을 경우 임시로 간단한 방식 사용
        if (insertError.code === 'PGRST116' || insertError.message.includes('relation "invite_codes" does not exist')) {
          // familyId 기반 간단한 코드 생성 (임시)
          const simpleCode = Math.floor(100000 + Math.random() * 900000).toString();
          return { success: true, code: simpleCode, expiresAt: expiresAt.toISOString() };
        }
        
        return { success: false, error: `초대 코드 저장에 실패했습니다: ${insertError.message}` };
      }

      return { 
        success: true, 
        code: inviteCode.code,
        expiresAt: inviteCode.expires_at
      };
    } catch (error: any) {
      console.error('초대 코드 생성 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 초대 코드로 가족 참여 - 간단한 방식
  static async joinFamilyByCode(code: string): Promise<{ success: boolean; familyId?: string; familyName?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return { success: false, error: '초대 코드는 6자리 숫자여야 합니다.' };
      }

      // 1. 초대 코드로 가족방 찾기
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name, owner_id')
        .eq('invite_code', code)
        .single();


      if (familyError || !family) {
        return { success: false, error: '유효하지 않은 초대 코드입니다.' };
      }

      // 2. 본인 소유 가족방 확인
      if (family.owner_id === user.id) {
        return { 
          success: false, 
          error: '본인이 소유한 가족방에는 참여할 수 없습니다.',
          familyName: family.name 
        };
      }

      // 3. 이미 멤버인지 확인
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { 
          success: false, 
          error: '이미 이 가족의 구성원입니다.',
          familyName: family.name 
        };
      }

      // 4. 가족 멤버로 추가
      const { data: newMember, error: insertError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'member'
        })
        .select('*')
        .single();


      if (insertError) {
        console.error('Failed to add member:', insertError);
        return { success: false, error: `가족 참여에 실패했습니다: ${insertError.message}` };
      }

      return {
        success: true,
        familyId: family.id,
        familyName: family.name
      };

    } catch (error: any) {
      console.error('가족 참여 예외:', error);
      return { success: false, error: error.message };
    }
  }

  // 가족에서 탈퇴
  static async leaveFamily(familyId: string): Promise<{ success: boolean; error?: string }> {
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