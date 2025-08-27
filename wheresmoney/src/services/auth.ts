import { supabase } from './supabase';
import { useAuthStore } from '../stores/authStore';

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.log('Profile fetch error:', profileError);
        }

        const user = {
          id: data.user.id,
          email: data.user.email!,
          nickname: userProfile?.nickname || 'User',
          avatar_url: userProfile?.avatar_url,
          created_at: userProfile?.created_at || new Date().toISOString(),
          updated_at: userProfile?.updated_at || new Date().toISOString(),
        };

        useAuthStore.getState().setUser(user);
        return { user, error: null };
      }

      return { user: null, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  static async signUp(email: string, password: string, nickname: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname,
            full_name: nickname
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // 트리거가 실행되지 않았을 경우 수동으로 프로필 생성
        try {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              nickname,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.log('Profile creation error:', profileError);
            // 프로필 생성 실패해도 회원가입은 성공으로 처리
          }
        } catch (profileErr) {
          console.log('Profile creation exception:', profileErr);
        }

        return { user: data.user, error: null };
      }

      return { user: null, error: null };
    } catch (error: any) {
      console.log('SignUp error:', error);
      return { user: null, error: error.message };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      useAuthStore.getState().setUser(null);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        let userData;

        if (profileError || !userProfile) {
          console.log('Profile not found, creating one:', profileError);
          
          // 프로필이 없으면 생성
          const nickname = user.user_metadata?.nickname || 
                          user.user_metadata?.full_name || 
                          user.email?.split('@')[0] || 
                          'User';

          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email!,
              nickname,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (createError) {
            console.log('Failed to create profile:', createError);
            // 프로필 생성 실패해도 기본 사용자 데이터로 진행
            userData = {
              id: user.id,
              email: user.email!,
              nickname,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          } else {
            userData = newProfile;
          }
        } else {
          userData = userProfile;
        }

        useAuthStore.getState().setUser(userData);
        return userData;
      }

      useAuthStore.getState().setUser(null);
      return null;
    } catch (error) {
      console.log('Error getting current user:', error);
      useAuthStore.getState().setUser(null);
      return null;
    }
  }
}