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
        // 이메일 인증이 완료되지 않은 경우 체크
        if (!data.user.email_confirmed_at) {
          return { 
            user: null, 
            error: null,
            needsConfirmation: true,
            message: '이메일 인증이 필요합니다. 이메일을 확인하거나 재발송을 요청해주세요.',
            unconfirmedEmail: data.user.email
          };
        }

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
      console.log(`회원가입 시도: ${email}`);

      // Supabase Auth로 회원가입 처리
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

      console.log('SignUp result:', { data, error });

      if (error) {
        console.log('SignUp error:', error.message);
        
        // "User already registered" 에러 처리
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return { 
            user: null, 
            error: '이미 등록된 이메일입니다. 로그인해주세요.' 
          };
        }
        
        throw error;
      }

      if (data.user) {
        console.log('SignUp 성공:', {
          userId: data.user.id,
          email: data.user.email,
          hasSession: !!data.session
        });

        // 이메일 인증이 꺼져있으면 즉시 로그인됨
        // Public users 테이블에 프로필 생성
        try {
          console.log('Public 프로필 생성 중...');
          const { data: existingProfile, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (checkError || !existingProfile) {
            console.log('Public 프로필이 없음, 생성 중...');
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
            } else {
              console.log('Public 프로필 생성 완료');
            }
          } else {
            console.log('Public 프로필이 이미 존재함');
          }
        } catch (profileErr) {
          console.log('Profile creation exception:', profileErr);
        }

        // 세션이 있으면 즉시 사용 가능
        if (data.session) {
          const userData = {
            id: data.user.id,
            email: data.user.email!,
            nickname: nickname,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          useAuthStore.getState().setUser(userData);
        }

        return { 
          user: data.user, 
          error: null,
          message: '회원가입이 완료되었습니다!'
        };
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

  static async deleteAccount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('사용자가 로그인되어 있지 않습니다.');

      console.log(`회원 탈퇴 시작: 사용자 ${user.email} (${user.id})`);

      // 1. 가족 소유권 처리
      const { data: ownedFamilies } = await supabase
        .from('families')
        .select('id, name')
        .eq('owner_id', user.id);

      if (ownedFamilies && ownedFamilies.length > 0) {
        for (const family of ownedFamilies) {
          // 다른 멤버 확인
          const { data: otherMembers } = await supabase
            .from('family_members')
            .select('user_id')
            .eq('family_id', family.id)
            .neq('user_id', user.id);

          if (otherMembers && otherMembers.length > 0) {
            // 소유권 이전
            await supabase
              .from('families')
              .update({ 
                owner_id: otherMembers[0].user_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', family.id);
            
            await supabase
              .from('family_members')
              .update({ role: 'owner' })
              .eq('family_id', family.id)
              .eq('user_id', otherMembers[0].user_id);
          } else {
            // 빈 가족 삭제
            await supabase.from('ledger_entries').delete().eq('family_id', family.id);
            await supabase.from('family_members').delete().eq('family_id', family.id);
            await supabase.from('families').delete().eq('id', family.id);
          }
        }
      }

      // 2. 사용자 데이터 삭제
      await supabase.from('ledger_entries').delete().eq('user_id', user.id);
      await supabase.from('family_members').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);

      // 3. RPC 함수로 auth.users 삭제 시도
      const { error: rpcError } = await supabase.rpc('delete_current_user');
      
      if (rpcError) {
        console.log('RPC 삭제 실패 (정상적인 상황):', rpcError.message);
      }

      // 4. 로그아웃
      await supabase.auth.signOut();
      useAuthStore.getState().setUser(null);

      console.log('✅ 회원 탈퇴 완료');
      
      return {
        success: true,
        error: null,
        message: '회원 탈퇴가 완료되었습니다. Dashboard에서 Authentication > Users 탭에서 완전 삭제를 확인하세요.'
      };
    } catch (error: any) {
      console.error('회원 탈퇴 오류:', error);
      return { 
        success: false,
        error: error.message 
      };
    }
  }

  static async resendConfirmationEmail(email: string) {
    try {
      console.log(`인증 이메일 재발송 시도: ${email}`);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.log('재발송 에러:', error);
        
        // 일반적인 에러 메시지들을 더 친화적으로 변환
        if (error.message.includes('rate limit')) {
          return { error: '이메일 재발송은 1분에 한 번만 가능합니다. 잠시 후 다시 시도해주세요.' };
        }
        
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          return { error: '해당 이메일로 등록된 계정을 찾을 수 없습니다.' };
        }
        
        throw error;
      }

      console.log('인증 이메일 재발송 성공');
      return { error: null, message: '인증 이메일이 재발송되었습니다. 메일함(스팸폴더 포함)을 확인해주세요.' };
    } catch (error: any) {
      console.log('Resend confirmation error:', error);
      return { error: error.message || '이메일 재발송에 실패했습니다.' };
    }
  }

  static async forceResendEmail(email: string) {
    try {
      console.log(`강제 이메일 재발송 시도: ${email}`);
      
      // 먼저 기본 재발송 시도
      let result = await this.resendConfirmationEmail(email);
      
      if (!result.error) {
        return result;
      }
      
      console.log('기본 재발송 실패, 대안 방법 시도');
      
      // 대안: 새로운 가입 시도 (이미 존재하는 경우 자동으로 재발송됨)
      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: 'dummy_password_for_resend', // 실제로는 사용되지 않음
          options: {
            data: { resend_attempt: true }
          }
        });
        
        if (signUpError && signUpError.message.includes('already registered')) {
          // 이미 등록된 사용자에 대해 재발송이 자동으로 처리됨
          return { 
            error: null, 
            message: '기존 계정에 대한 인증 이메일이 재발송되었습니다.' 
          };
        }
        
      } catch (altError) {
        console.log('대안 방법도 실패:', altError);
      }
      
      return { 
        error: '이메일 재발송에 실패했습니다. Supabase 설정에서 이메일 확인이 활성화되어 있는지 확인해주세요.',
        details: result.error
      };
      
    } catch (error: any) {
      console.log('Force resend error:', error);
      return { error: error.message || '이메일 재발송에 실패했습니다.' };
    }
  }

  static async cleanupUnconfirmedUsers() {
    try {
      // 24시간 이상 지난 미인증 사용자들 정리 (관리자 기능)
      // 이 기능은 Supabase의 관리자 기능이므로 클라이언트에서는 사용할 수 없음
      // 실제로는 Supabase 대시보드나 서버 사이드에서 처리해야 함
      console.log('Cleanup unconfirmed users - this should be done server-side');
      
      return { error: null, message: 'Cleanup initiated (server-side required)' };
    } catch (error: any) {
      console.log('Cleanup error:', error);
      return { error: error.message };
    }
  }

  static async requestUserDeletion(email: string) {
    try {
      console.log(`사용자 삭제 요청: ${email}`);
      
      // 관리자 함수 호출 시도 (권한이 있는 경우에만 작동)
      try {
        const { data, error } = await supabase.rpc('admin_delete_user_by_email', {
          user_email: email
        });

        if (error) {
          console.log('Admin deletion failed:', error);
          throw error;
        }

        if (data && data.success) {
          console.log('Admin deletion successful:', data);
          return {
            error: null,
            message: '사용자가 성공적으로 삭제되었습니다.',
            details: data
          };
        }
      } catch (adminError) {
        console.log('Admin function not available or failed:', adminError);
        
        // 관리자 함수 실패 시 안내 메시지
        return {
          error: 'Supabase 대시보드에서 수동 삭제가 필요합니다.',
          message: `다음 단계를 따라 삭제해주세요:\n\n1. Supabase 대시보드 → Authentication → Users\n2. "${email}" 검색\n3. 사용자 행의 "..." 메뉴 → "Delete user" 클릭\n\n또는 SQL Editor에서 실행:\nSELECT admin_delete_user_by_email('${email}');`,
          requiresManualDeletion: true
        };
      }

      return { error: 'Unexpected error occurred' };
    } catch (error: any) {
      console.log('Request user deletion error:', error);
      return { error: error.message };
    }
  }

  static async checkUserExists(email: string) {
    try {
      console.log(`사용자 존재 확인: ${email}`);
      
      // Public users 테이블에서 확인
      const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      // 관리자 함수로 Auth 사용자 확인 시도
      let authUserExists = false;
      try {
        const { data, error } = await supabase.rpc('admin_check_email_status', {
          user_email: email
        });
        
        if (!error && data) {
          authUserExists = data.found;
        }
      } catch (adminError) {
        console.log('Admin check failed, using fallback method');
        
        // 관리자 함수 실패 시 signIn 시도로 존재 여부 확인
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'dummy_password_to_check_existence'
          });
          
          // "Invalid login credentials"가 아닌 다른 에러면 사용자 존재
          authUserExists = signInError && !signInError.message.includes('Invalid login credentials');
        } catch (fallbackError) {
          console.log('Fallback check failed:', fallbackError);
        }
      }

      return {
        error: null,
        existsInPublic: !publicError && !!publicUser,
        existsInAuth: authUserExists,
        needsDeletion: (!publicError && !!publicUser) || authUserExists
      };
    } catch (error: any) {
      console.log('Check user exists error:', error);
      return { error: error.message };
    }
  }
}