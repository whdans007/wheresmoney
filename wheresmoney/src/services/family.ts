import { supabase } from './supabase';
import { Family, FamilyMember } from '../types';

export class FamilyService {
  static async createFamily(name: string, description?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

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

      if (familyError) throw familyError;

      // Add owner as member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      return { family, error: null };
    } catch (error: any) {
      return { family: null, error: error.message };
    }
  }

  static async getUserFamilies() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: families, error } = await supabase
        .from('family_members')
        .select(`
          family_id,
          role,
          families (
            id,
            name,
            description,
            owner_id,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedFamilies = families?.map(item => ({
        ...item.families,
        user_role: item.role,
      })) || [];

      return { families: formattedFamilies, error: null };
    } catch (error: any) {
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

      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select(`
          id,
          role,
          joined_at,
          users (
            id,
            nickname,
            avatar_url
          )
        `)
        .eq('family_id', familyId);

      if (membersError) throw membersError;

      return { 
        family, 
        members: members || [], 
        error: null 
      };
    } catch (error: any) {
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