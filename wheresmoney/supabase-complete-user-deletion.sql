-- 기존 가입자 정보를 완전히 삭제하기 위한 관리자 함수들
-- 이 스크립트는 Supabase 대시보드의 SQL Editor에서 실행하세요.

-- 1. 특정 이메일 주소의 모든 데이터를 완전 삭제하는 관리자 함수
CREATE OR REPLACE FUNCTION admin_delete_user_by_email(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
  deleted_families INTEGER := 0;
  deleted_entries INTEGER := 0;
  deleted_memberships INTEGER := 0;
BEGIN
  -- 1. Auth 사용자 ID 찾기
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found with email: ' || user_email
    );
  END IF;
  
  RAISE NOTICE 'Found user ID: % for email: %', target_user_id, user_email;
  
  -- 2. 사용자 데이터 삭제 시작
  
  -- 2-1. 사용자의 ledger_entries 삭제
  DELETE FROM public.ledger_entries WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_entries = ROW_COUNT;
  RAISE NOTICE 'Deleted % ledger entries', deleted_entries;
  
  -- 2-2. 사용자의 family_members 삭제
  DELETE FROM public.family_members WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_memberships = ROW_COUNT;
  RAISE NOTICE 'Deleted % family memberships', deleted_memberships;
  
  -- 2-3. 사용자가 소유한 빈 가족들 삭제 (다른 멤버가 없는 경우)
  WITH empty_families AS (
    SELECT f.id 
    FROM public.families f
    WHERE f.owner_id = target_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.family_id = f.id AND fm.user_id != target_user_id
    )
  )
  DELETE FROM public.families 
  WHERE id IN (SELECT id FROM empty_families);
  GET DIAGNOSTICS deleted_families = ROW_COUNT;
  RAISE NOTICE 'Deleted % empty families', deleted_families;
  
  -- 2-4. 사용자 프로필 삭제
  DELETE FROM public.users WHERE id = target_user_id;
  
  -- 2-5. Auth 사용자 삭제 (가장 중요!)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RAISE NOTICE 'User completely deleted: %', user_email;
  
  RETURN json_build_object(
    'success', true,
    'message', 'User completely deleted',
    'user_email', user_email,
    'user_id', target_user_id,
    'deleted_entries', deleted_entries,
    'deleted_memberships', deleted_memberships,
    'deleted_families', deleted_families
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error deleting user %: %', user_email, SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM,
      'user_email', user_email
    );
END;
$$;

-- 2. 미인증 사용자들을 모두 삭제하는 함수
CREATE OR REPLACE FUNCTION admin_delete_unconfirmed_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  deleted_count INTEGER := 0;
  deleted_emails TEXT[] := '{}';
BEGIN
  -- 24시간 이상 지난 미인증 사용자들 삭제
  FOR user_record IN 
    SELECT id, email
    FROM auth.users
    WHERE email_confirmed_at IS NULL
      AND created_at < NOW() - INTERVAL '1 hour' -- 1시간으로 단축 (테스트용)
  LOOP
    -- 관련 데이터 먼저 삭제
    DELETE FROM public.ledger_entries WHERE user_id = user_record.id;
    DELETE FROM public.family_members WHERE user_id = user_record.id;
    DELETE FROM public.users WHERE id = user_record.id;
    
    -- Auth 사용자 삭제
    DELETE FROM auth.users WHERE id = user_record.id;
    
    deleted_emails := array_append(deleted_emails, user_record.email);
    deleted_count := deleted_count + 1;
    
    RAISE NOTICE 'Deleted unconfirmed user: %', user_record.email;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'deleted_emails', deleted_emails
  );
END;
$$;

-- 3. 특정 이메일로 등록된 모든 사용자 정보 조회 (디버깅용)
CREATE OR REPLACE FUNCTION admin_find_user_by_email(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user RECORD;
  public_user RECORD;
  result JSON;
BEGIN
  -- Auth 테이블에서 사용자 찾기
  SELECT id, email, email_confirmed_at, created_at, updated_at
  INTO auth_user
  FROM auth.users 
  WHERE email = user_email;
  
  -- Public 테이블에서 사용자 찾기
  SELECT id, email, nickname, created_at, updated_at
  INTO public_user
  FROM public.users
  WHERE email = user_email;
  
  RETURN json_build_object(
    'auth_user', row_to_json(auth_user),
    'public_user', row_to_json(public_user),
    'found_in_auth', auth_user IS NOT NULL,
    'found_in_public', public_user IS NOT NULL
  );
END;
$$;

-- 4. 이메일 재발송을 위한 사용자 상태 확인
CREATE OR REPLACE FUNCTION admin_check_email_status(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_info RECORD;
BEGIN
  SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    email_confirmed_at,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_since_creation
  INTO user_info
  FROM auth.users
  WHERE email = user_email;
  
  IF user_info IS NULL THEN
    RETURN json_build_object(
      'found', false,
      'message', 'No user found with this email'
    );
  END IF;
  
  RETURN json_build_object(
    'found', true,
    'user_id', user_info.id,
    'email', user_info.email,
    'email_confirmed', user_info.email_confirmed,
    'email_confirmed_at', user_info.email_confirmed_at,
    'created_at', user_info.created_at,
    'hours_since_creation', user_info.hours_since_creation,
    'can_resend', NOT user_info.email_confirmed
  );
END;
$$;

-- 권한 설정 (매우 제한적으로만 부여)
-- 보안상 이 함수들은 서비스 역할에서만 사용해야 함
REVOKE EXECUTE ON FUNCTION admin_delete_user_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_delete_unconfirmed_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_find_user_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_check_email_status(TEXT) FROM PUBLIC;

-- 사용법 예시:
-- 
-- 1. 특정 이메일 사용자 완전 삭제:
-- SELECT admin_delete_user_by_email('user@example.com');
--
-- 2. 모든 미인증 사용자 삭제:
-- SELECT admin_delete_unconfirmed_users();
--
-- 3. 사용자 정보 확인:
-- SELECT admin_find_user_by_email('user@example.com');
--
-- 4. 이메일 상태 확인:
-- SELECT admin_check_email_status('user@example.com');
--
-- 주의사항:
-- - 이 함수들은 데이터를 영구적으로 삭제합니다
-- - 프로덕션에서 사용하기 전에 백업을 만드세요
-- - 테스트 환경에서 충분히 검증 후 사용하세요