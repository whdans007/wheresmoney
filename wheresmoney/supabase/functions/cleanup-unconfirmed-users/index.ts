// Supabase Edge Function: cleanup-unconfirmed-users
// 24시간 이상 미인증 상태인 사용자를 자동으로 삭제
// Cron Job으로 매일 실행되도록 설정

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Service Role Key를 사용한 Admin 클라이언트
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 24시간 이상 미인증 상태인 사용자 조회
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    console.log(`미인증 사용자 정리 시작 (기준: ${cutoffTime.toISOString()})`);

    // Auth admin API로 모든 사용자 조회
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`사용자 목록 조회 실패: ${listError.message}`);
    }

    const deletedUsers = [];
    const errors = [];

    for (const user of users) {
      // 미인증 사용자 && 24시간 이상 경과 확인
      if (!user.email_confirmed_at && user.created_at) {
        const createdAt = new Date(user.created_at);
        
        if (createdAt < cutoffTime) {
          try {
            console.log(`삭제 대상: ${user.email} (생성: ${user.created_at})`);
            
            // Public 데이터 정리
            await supabaseAdmin.from('ledger_entries').delete().eq('user_id', user.id);
            await supabaseAdmin.from('family_members').delete().eq('user_id', user.id);
            await supabaseAdmin.from('users').delete().eq('id', user.id);
            
            // Auth 사용자 삭제
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            
            if (deleteError) {
              throw deleteError;
            }
            
            deletedUsers.push({
              email: user.email,
              id: user.id,
              created_at: user.created_at,
            });
            
          } catch (error) {
            console.error(`삭제 실패 ${user.email}:`, error);
            errors.push({
              email: user.email,
              error: error.message,
            });
          }
        }
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      deletedCount: deletedUsers.length,
      deletedUsers: deletedUsers,
      errors: errors,
      message: `${deletedUsers.length}명의 미인증 사용자가 삭제되었습니다.`,
    };

    console.log('정리 완료:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});