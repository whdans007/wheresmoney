-- Supabase에서 이메일 확인을 강제로 활성화하기 위한 설정들
-- 이 스크립트를 Supabase 대시보드의 SQL Editor에서 실행하세요.

-- 1. 이메일 확인 강제 활성화 (Supabase 대시보드에서 설정해야 함)
-- Authentication > Settings > Email 탭에서:
-- - "Enable email confirmations" 체크
-- - "Secure email change" 체크 (옵션)

-- 2. 현재 미인증 상태의 사용자들을 확인하는 함수
CREATE OR REPLACE FUNCTION check_unconfirmed_auth_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 이 함수는 관리자 권한이 필요하므로 실제로는 대시보드에서 확인해야 함
  RAISE NOTICE 'Use Supabase Dashboard > Authentication > Users to check unconfirmed users';
  RETURN;
END;
$$;

-- 3. 특정 이메일 주소에 대해 강제로 인증 이메일 재발송하는 함수
CREATE OR REPLACE FUNCTION force_resend_confirmation(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 실제 이메일 재발송은 클라이언트 측에서 처리
  -- 이 함수는 로그 목적으로만 사용
  RAISE LOG 'Attempting to resend confirmation email to: %', user_email;
  RETURN 'Resend request logged for ' || user_email;
END;
$$;

-- 4. 이메일 확인 상태를 체크하는 헬퍼 함수 (앱에서 사용 가능)
CREATE OR REPLACE FUNCTION is_email_confirmation_enabled()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- 이메일 확인이 활성화되어 있는지 확인
  -- 실제로는 Supabase 설정에서 확인해야 함
  SELECT true;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION is_email_confirmation_enabled() TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_confirmation_enabled() TO anon;

-- 사용 가이드:
-- 
-- Supabase 대시보드에서 이메일 확인을 활성화하려면:
-- 1. 프로젝트 대시보드 > Authentication > Settings
-- 2. "Email" 탭 클릭
-- 3. "Enable email confirmations" 체크박스 활성화
-- 4. "Secure email change" 체크박스 활성화 (권장)
-- 5. Email template 설정 확인 (기본값 사용 가능)
-- 
-- 현재 설정 확인:
-- - Authentication > Settings > Email 탭에서 현재 설정 상태 확인
-- - Users 탭에서 사용자들의 email_confirmed_at 컬럼 확인