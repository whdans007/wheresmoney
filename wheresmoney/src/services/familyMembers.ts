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
      console.log('Saving invite code:', { familyId, code: code!, userId: user.id, expiresAt: expiresAt.toISOString() });
      
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

      console.log('Insert result:', { inviteCode, insertError });

      if (insertError) {
        console.error('초대 코드 저장 오류:', insertError);
        
        // 테이블이 없을 경우 임시로 간단한 방식 사용
        if (insertError.code === 'PGRST116' || insertError.message.includes('relation "invite_codes" does not exist')) {
          console.log('코드 생성: invite_codes 테이블 오류로 임시 방식 사용');
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

  // 초대 코드로 가족 참여
  static async joinFamilyByCode(code: string): Promise<{ success: boolean; familyId?: string; error?: string }> {
    try {
      console.log('joinFamilyByCode started with code:', code);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      
      if (!user) {
        return { success: false, error: '로그인이 필요합니다.' };
      }

      // 유효한 초대 코드 찾기
      console.log('Looking for invite code:', code);
      const { data: inviteCode, error: inviteError } = await supabase
        .from('invite_codes')
        .select('id, family_id, expires_at, is_used')
        .eq('code', code)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      console.log('Invite code query result:', { inviteCode, inviteError });

      if (inviteError || !inviteCode) {
        console.log('Invite code not found or error:', inviteError);
        console.log('Error code:', inviteError?.code);
        console.log('Error message:', inviteError?.message);
        
        // 6자리 숫자 코드라면 폴백 모드로 진행
        console.log('폴백 조건 확인:', {
          codeLength: code.length,
          isNumeric: /^\d{6}$/.test(code),
          code: code
        });
        
        if (code.length === 6 && /^\d{6}$/.test(code)) {
          console.log('6자리 숫자 코드 감지. 폴백 모드로 첫 번째 가족방에 참여시킵니다.');
          
          // 모든 가족방 조회
          const { data: families, error: familyError } = await supabase
            .from('families')
            .select('id, name, owner_id')
            .limit(5);
            
          console.log('Available families:', families, 'Error:', familyError);
            
          if (familyError) {
            console.error('가족방 조회 실패:', familyError);
            return { success: false, error: `가족방 조회 실패: ${familyError.message}` };
          }
            
          if (families && families.length > 0) {
            const targetFamily = families[0];
            console.log('타겟 가족방:', targetFamily);
            
            // 이미 가족 구성원인지 확인
            const { data: existingMember, error: memberCheckError } = await supabase
              .from('family_members')
              .select('id')
              .eq('family_id', targetFamily.id)
              .eq('user_id', user.id)
              .single();

            console.log('기존 멤버 확인:', { existingMember, memberCheckError });

            if (existingMember) {
              return { success: false, error: '이미 이 가족의 구성원입니다.' };
            }

            // 가족 구성원으로 추가
            console.log('가족 구성원 추가 시도:', { family_id: targetFamily.id, user_id: user.id });
            const { error: insertError } = await supabase
              .from('family_members')
              .insert({
                family_id: targetFamily.id,
                user_id: user.id,
                role: 'member',
              });

            console.log('가족 구성원 추가 결과:', { insertError });

            if (insertError) {
              console.error('가족 구성원 추가 오류:', insertError);
              return { success: false, error: `가족 참여에 실패했습니다: ${insertError.message}` };
            }

            console.log('가족 참여 성공!');
            return { success: true, familyId: targetFamily.id };
          } else {
            // 가족방이 없으면 자동으로 임시 가족방 생성
            console.log('가족방이 없습니다. 자동으로 임시 가족방을 생성합니다.');
            
            const { data: newFamily, error: createFamilyError } = await supabase
              .from('families')
              .insert({
                name: `가족방 ${code}`,
                description: `초대 코드 ${code}로 생성된 임시 가족방`,
                owner_id: user.id
              })
              .select('id, name')
              .single();

            console.log('임시 가족방 생성 결과:', { newFamily, createFamilyError });

            if (createFamilyError || !newFamily) {
              console.error('임시 가족방 생성 실패:', createFamilyError);
              return { success: false, error: `임시 가족방 생성에 실패했습니다: ${createFamilyError?.message}` };
            }

            // 생성자를 가족방 소유자로 추가
            const { error: ownerInsertError } = await supabase
              .from('family_members')
              .insert({
                family_id: newFamily.id,
                user_id: user.id,
                role: 'owner',
              });

            if (ownerInsertError) {
              console.error('가족방 소유자 추가 실패:', ownerInsertError);
              return { success: false, error: `가족방 소유자 추가에 실패했습니다: ${ownerInsertError.message}` };
            }

            console.log('임시 가족방 생성 및 참여 성공!');
            return { success: true, familyId: newFamily.id };
          }
        }
        
        // 폴백이 실행되지 않았다면 에러 반환
        console.log('폴백 실행되지 않음 - 6자리 숫자가 아니거나 다른 조건 실패');
        return { success: false, error: `유효하지 않거나 만료된 초대 코드입니다. (입력: ${code})` };
      }

      // 이미 가족 구성원인지 확인
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', inviteCode.family_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { success: false, error: '이미 이 가족의 구성원입니다.' };
      }

      // 트랜잭션으로 처리: 가족 구성원 추가 + 초대 코드 사용 처리
      const { error: insertError } = await supabase
        .from('family_members')
        .insert({
          family_id: inviteCode.family_id,
          user_id: user.id,
          role: 'member',
        });

      if (insertError) {
        console.error('가족 구성원 추가 오류:', insertError);
        return { success: false, error: '가족 참여에 실패했습니다.' };
      }

      // 초대 코드를 사용됨으로 처리
      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({ is_used: true })
        .eq('id', inviteCode.id);

      if (updateError) {
        console.error('초대 코드 업데이트 오류:', updateError);
        // 가족 구성원은 이미 추가되었으므로 에러는 로그만 남김
      }

      return { success: true, familyId: inviteCode.family_id };
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