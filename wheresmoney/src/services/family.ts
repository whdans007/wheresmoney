import { supabase } from './supabase';
import { Family, FamilyMember } from '../types';

export class FamilyService {
  static async createFamily(name: string, description?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');


      // Generate unique 6-digit invite code
      let inviteCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Check if code already exists
        const { data: existingFamily } = await supabase
          .from('families')
          .select('id')
          .eq('invite_code', inviteCode)
          .single();

        if (!existingFamily) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('초대 코드 생성에 실패했습니다. 다시 시도해주세요.');
      }


      // Create family with invite code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
          description,
          owner_id: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single();


      if (familyError) {
        console.error('Family creation error:', familyError);
        throw familyError;
      }

      // Add owner as member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'owner',
        });


      if (memberError) {
        console.error('Member creation error:', memberError);
        throw memberError;
      }

      return { family, error: null };
    } catch (error: any) {
      console.error('CreateFamily error:', error);
      return { family: null, error: error.message };
    }
  }

  static async getUserFamilies() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');


      // 가장 간단한 쿼리로 시작 - 자신의 멤버십만 가져오기
      const { data: memberships, error: memberError } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', user.id);


      if (memberError) {
        console.error('Member error:', memberError);
        throw memberError;
      }

      if (!memberships || memberships.length === 0) {
        return { families: [], error: null };
      }

      // 가족방 정보를 서비스 레벨에서 안전하게 쿼리
      const familyIds = memberships.map(m => m.family_id);

      // 사용자가 멤버인 가족방만 조회 (서비스 레벨 보안)
      const { data: families, error: familyError } = await supabase
        .from('families')
        .select('id, name, description, owner_id, created_at')
        .in('id', familyIds);


      if (familyError) {
        console.error('Family error:', familyError);
        throw familyError;
      }

      // 데이터 조합
      const formattedFamilies = families?.map(family => {
        const membership = memberships.find(m => m.family_id === family.id);
        return {
          ...family,
          user_role: membership?.role || 'member',
        };
      }) || [];

      return { families: formattedFamilies, error: null };
    } catch (error: any) {
      console.error('Error getting user families:', error);
      return { families: [], error: error.message };
    }
  }

  static async getFamilyDetails(familyId: string) {
    try {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;

      // 단계별 쿼리로 멤버 정보 가져오기
      const { data: memberIds, error: memberError } = await supabase
        .from('family_members')
        .select('id, role, joined_at, user_id')
        .eq('family_id', familyId);

      if (memberError) throw memberError;

      let members = [];
      if (memberIds && memberIds.length > 0) {
        const userIds = memberIds.map(m => m.user_id);
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, nickname, avatar_url')
          .in('id', userIds);

        if (userError) {
          console.error('Error getting users:', userError);
        }

        // 데이터 조합
        members = memberIds.map(member => {
          const user = users?.find(u => u.id === member.user_id);
          return {
            ...member,
            users: user || { id: member.user_id, nickname: 'Unknown', avatar_url: null }
          };
        });
      }

      return { 
        family, 
        members: members || [], 
        error: null 
      };
    } catch (error: any) {
      console.error('Error getting family details:', error);
      return { 
        family: null, 
        members: [], 
        error: error.message 
      };
    }
  }

  static async inviteMember(familyId: string, email: string) {
    try {
      // Check if user exists
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
      }

      const userId = users[0].id;

      // Check if already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingMember) {
        throw new Error('이미 가족방 멤버입니다.');
      }

      // Add as member
      const { error: insertError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: userId,
          role: 'member',
        });

      if (insertError) throw insertError;

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async leaveFamily(familyId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', user.id);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async deleteFamily(familyId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');


      // 가족방 소유자인지 확인
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('owner_id')
        .eq('id', familyId)
        .single();


      if (familyError) {
        throw new Error(`가족방 정보 조회 실패: ${familyError.message}`);
      }

      if (!family) {
        throw new Error('가족방을 찾을 수 없습니다.');
      }

      if (family.owner_id !== user.id) {
        throw new Error('가족방 소유자만 삭제할 수 있습니다.');
      }

      // 1. 먼저 ledger_entries 삭제
      const { error: ledgerDeleteError } = await supabase
        .from('ledger_entries')
        .delete()
        .eq('family_id', familyId);

      // ledger_entries는 존재하지 않을 수 있으므로 에러를 무시

      // 2. invite_codes 삭제
      const { error: inviteCodesDeleteError } = await supabase
        .from('invite_codes')
        .delete()
        .eq('family_id', familyId);

      // invite_codes도 존재하지 않을 수 있으므로 에러를 무시

      // 3. family_members에서 모든 구성원 삭제
      const { error: membersDeleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId);


      if (membersDeleteError) {
        throw new Error(`가족 구성원 삭제 실패: ${membersDeleteError.message}`);
      }

      // 4. 마지막으로 families 테이블에서 가족방 삭제
      const { data: deletedData, error: deleteError } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId)
        .eq('owner_id', user.id) // 안전을 위한 이중 체크
        .select(); // 삭제된 데이터 반환


      if (deleteError) {
        throw new Error(`가족방 삭제 실패: ${deleteError.message}`);
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Delete family error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getFamilyInviteCode(familyId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 가족방 소유자인지 확인하고 invite_code 가져오기
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('owner_id, invite_code')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;

      if (!family || family.owner_id !== user.id) {
        throw new Error('가족방 소유자만 초대 코드를 볼 수 있습니다.');
      }

      return { 
        inviteCode: family.invite_code, 
        error: null 
      };
    } catch (error: any) {
      console.error('Get family invite code error:', error);
      return { 
        inviteCode: null, 
        error: error.message 
      };
    }
  }

  static async generateNewInviteCode(familyId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');


      // 가족방 소유자인지 확인
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('owner_id, name')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;

      if (!family || family.owner_id !== user.id) {
        throw new Error('가족방 소유자만 초대 코드를 생성할 수 있습니다.');
      }

      // 새로운 고유한 6자리 코드 생성
      let newInviteCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        newInviteCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 중복 확인
        const { data: existingFamily } = await supabase
          .from('families')
          .select('id')
          .eq('invite_code', newInviteCode)
          .single();

        if (!existingFamily) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('새로운 초대 코드 생성에 실패했습니다. 다시 시도해주세요.');
      }


      // 새로운 코드로 업데이트

      const { data: updateResult, error: updateError } = await supabase
        .from('families')
        .update({ invite_code: newInviteCode! })
        .eq('id', familyId)
        .eq('owner_id', user.id) // 안전을 위한 이중 체크
        .select('id, name, invite_code');


      if (updateError) {
        console.error('Failed to update invite code:', updateError);
        throw updateError;
      }

      if (!updateResult || updateResult.length === 0) {
        throw new Error('초대 코드 업데이트에 실패했습니다. 권한을 확인해주세요.');
      }


      return { 
        inviteCode: newInviteCode!, 
        error: null 
      };
    } catch (error: any) {
      console.error('Generate new invite code error:', error);
      return { 
        inviteCode: null, 
        error: error.message 
      };
    }
  }
}