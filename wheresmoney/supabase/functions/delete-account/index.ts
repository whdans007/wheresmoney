// Supabase Edge Function: delete-account
// 사용자 계정을 완전히 삭제하는 서버사이드 함수

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. 사용자 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // 2. Supabase 클라이언트 생성 (Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. 요청한 사용자 확인 (일반 클라이언트)
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;
    const userEmail = user.email;
    
    console.log(`탈퇴 요청: ${userEmail} (${userId})`);

    // 4. 관련 데이터 삭제 로직
    const deletionSteps = [];
    
    // 4-1. 가족 소유권 이전 처리
    const { data: ownedFamilies } = await supabaseAdmin
      .from('families')
      .select('id, name')
      .eq('owner_id', userId);
    
    if (ownedFamilies && ownedFamilies.length > 0) {
      for (const family of ownedFamilies) {
        // 다른 멤버 찾기
        const { data: otherMembers } = await supabaseAdmin
          .from('family_members')
          .select('user_id')
          .eq('family_id', family.id)
          .neq('user_id', userId)
          .limit(1);
        
        if (otherMembers && otherMembers.length > 0) {
          // 소유권 이전
          await supabaseAdmin
            .from('families')
            .update({ 
              owner_id: otherMembers[0].user_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', family.id);
          
          await supabaseAdmin
            .from('family_members')
            .update({ role: 'owner' })
            .eq('family_id', family.id)
            .eq('user_id', otherMembers[0].user_id);
          
          deletionSteps.push(`가족 "${family.name}" 소유권 이전`);
        } else {
          // 빈 가족 삭제
          await supabaseAdmin.from('ledger_entries').delete().eq('family_id', family.id);
          await supabaseAdmin.from('family_members').delete().eq('family_id', family.id);
          await supabaseAdmin.from('families').delete().eq('id', family.id);
          
          deletionSteps.push(`빈 가족 "${family.name}" 삭제`);
        }
      }
    }

    // 4-2. 사용자 데이터 삭제
    const { error: ledgerError } = await supabaseAdmin
      .from('ledger_entries')
      .delete()
      .eq('user_id', userId);
    
    if (!ledgerError) deletionSteps.push('가계부 기록 삭제');

    const { error: memberError } = await supabaseAdmin
      .from('family_members')
      .delete()
      .eq('user_id', userId);
    
    if (!memberError) deletionSteps.push('가족 멤버십 삭제');

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (!profileError) deletionSteps.push('프로필 삭제');

    // 4-3. Storage 데이터 삭제 (프로필 이미지 등)
    try {
      const { data: storageFiles } = await supabaseAdmin
        .storage
        .from('avatars')
        .list(userId);
      
      if (storageFiles && storageFiles.length > 0) {
        const filePaths = storageFiles.map(file => `${userId}/${file.name}`);
        await supabaseAdmin.storage.from('avatars').remove(filePaths);
        deletionSteps.push('저장소 파일 삭제');
      }
    } catch (storageError) {
      console.error('Storage 삭제 오류:', storageError);
    }

    // 5. Auth 사용자 삭제 (가장 중요!)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error('Auth 삭제 실패:', deleteAuthError);
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    }
    
    deletionSteps.push('Auth 계정 삭제');

    // 6. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: '계정이 완전히 삭제되었습니다.',
        deletedUser: userEmail,
        deletionSteps: deletionSteps,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Delete account error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});