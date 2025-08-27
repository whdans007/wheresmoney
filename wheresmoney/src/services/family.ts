import { supabase } from './supabase';
import { Family, FamilyMember } from '../types';

export class FamilyService {
  static async createFamily(name: string, description?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Creating family for user:', { userId: user.id, name, description });

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single();

      console.log('Family creation result:', { family, familyError });

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

      console.log('Member creation result:', { memberError });

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

      console.log('Loading families for user:', user.id);

      // 가장 간단한 쿼리로 시작 - 자신의 멤버십만 가져오기
      const { data: memberships, error: memberError } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', user.id);

      console.log('Memberships result:', { memberships, memberError });

      if (memberError) {
        console.error('Member error:', memberError);
        throw memberError;
      }

      if (!memberships || memberships.length === 0) {
        console.log('No memberships found');
        return { families: [], error: null };
      }

      // 가족방 정보를 서비스 레벨에서 안전하게 쿼리
      const familyIds = memberships.map(m => m.family_id);
      console.log('Family IDs to fetch:', familyIds);

      // 사용자가 멤버인 가족방만 조회 (서비스 레벨 보안)
      const { data: families, error: familyError } = await supabase
        .from('families')
        .select('id, name, description, owner_id, created_at')
        .in('id', familyIds);

      console.log('Families result:', { families, familyError });

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

      console.log('Final formatted families:', formattedFamilies);
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
          console.log('Error getting users:', userError);
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
      console.log('Error getting family details:', error);
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
}