-- 미인증 사용자 정리를 위한 관리자 함수들
-- 이 스크립트는 Supabase 대시보드에서 관리자가 실행해야 합니다.

-- 24시간 이상 지난 미인증 사용자들을 조회하는 함수
CREATE OR REPLACE FUNCTION get_unconfirmed_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  hours_since_creation NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    EXTRACT(EPOCH FROM (NOW() - au.created_at))/3600 as hours_since_creation
  FROM auth.users au
  WHERE au.email_confirmed_at IS NULL
    AND au.created_at < NOW() - INTERVAL '24 hours'
  ORDER BY au.created_at DESC;
END;
$$;

-- 24시간 이상 지난 미인증 사용자들을 삭제하는 함수
CREATE OR REPLACE FUNCTION cleanup_unconfirmed_users()
RETURNS TABLE(
  deleted_count INTEGER,
  deleted_emails TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  deleted_emails TEXT[] := '{}';
  user_record RECORD;
BEGIN
  -- 삭제할 사용자들의 이메일을 먼저 수집
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    WHERE au.email_confirmed_at IS NULL
      AND au.created_at < NOW() - INTERVAL '24 hours'
  LOOP
    deleted_emails := array_append(deleted_emails, user_record.email);
    
    -- 관련 데이터 정리 (만약 존재한다면)
    DELETE FROM public.users WHERE id = user_record.id;
    
    -- auth.users에서 삭제
    DELETE FROM auth.users WHERE id = user_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN QUERY SELECT deleted_count, deleted_emails;
END;
$$;

-- 특정 시간(시간 단위) 이상 지난 미인증 사용자들을 삭제하는 함수
CREATE OR REPLACE FUNCTION cleanup_unconfirmed_users_older_than(hours_threshold INTEGER DEFAULT 24)
RETURNS TABLE(
  deleted_count INTEGER,
  deleted_emails TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  deleted_emails TEXT[] := '{}';
  user_record RECORD;
BEGIN
  -- 삭제할 사용자들의 이메일을 먼저 수집
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    WHERE au.email_confirmed_at IS NULL
      AND au.created_at < NOW() - (hours_threshold || ' hours')::INTERVAL
  LOOP
    deleted_emails := array_append(deleted_emails, user_record.email);
    
    -- 관련 데이터 정리 (만약 존재한다면)
    DELETE FROM public.users WHERE id = user_record.id;
    
    -- auth.users에서 삭제
    DELETE FROM auth.users WHERE id = user_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN QUERY SELECT deleted_count, deleted_emails;
END;
$$;

-- 사용법 예시 (주석으로만 제공):
-- 
-- 1. 미인증 사용자들 조회:
-- SELECT * FROM get_unconfirmed_users();
--
-- 2. 24시간 이상 지난 미인증 사용자들 정리:
-- SELECT * FROM cleanup_unconfirmed_users();
--
-- 3. 48시간 이상 지난 미인증 사용자들 정리:
-- SELECT * FROM cleanup_unconfirmed_users_older_than(48);
--
-- 주의사항:
-- - 이 함수들은 관리자 권한이 필요합니다
-- - 프로덕션에서 사용하기 전에 테스트 환경에서 충분히 검증하세요
-- - 정기적인 정리를 원한다면 Supabase의 cron job 기능을 사용하세요

-- 권한 설정 (service_role에만 실행 권한 부여)
REVOKE EXECUTE ON FUNCTION get_unconfirmed_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cleanup_unconfirmed_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cleanup_unconfirmed_users_older_than(INTEGER) FROM PUBLIC;

-- 필요시 특정 역할에만 권한 부여 (예: 관리자 역할)
-- GRANT EXECUTE ON FUNCTION get_unconfirmed_users() TO admin_role;
-- GRANT EXECUTE ON FUNCTION cleanup_unconfirmed_users() TO admin_role;
-- GRANT EXECUTE ON FUNCTION cleanup_unconfirmed_users_older_than(INTEGER) TO admin_role;