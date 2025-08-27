-- 탈퇴 후 재가입 안 되는 문제 진단용 SQL
-- 문제되는 이메일 주소를 확인하여 어디에 데이터가 남아있는지 체크

-- 1. 확인할 이메일 주소 (이 부분을 실제 이메일로 변경하세요)
DO $$
DECLARE
  check_email TEXT := '문제되는이메일@example.com'; -- 여기를 실제 이메일로 변경
BEGIN
  RAISE NOTICE '=== 사용자 데이터 상태 확인: % ===', check_email;
  
  -- Auth 테이블 확인
  DECLARE
    auth_user_count INTEGER;
    auth_user_info RECORD;
  BEGIN
    SELECT COUNT(*) INTO auth_user_count FROM auth.users WHERE email = check_email;
    RAISE NOTICE '1. auth.users 테이블: % 개의 레코드', auth_user_count;
    
    IF auth_user_count > 0 THEN
      SELECT id, email, email_confirmed_at, created_at 
      INTO auth_user_info 
      FROM auth.users 
      WHERE email = check_email;
      
      RAISE NOTICE '   - ID: %', auth_user_info.id;
      RAISE NOTICE '   - Email: %', auth_user_info.email;
      RAISE NOTICE '   - Email Confirmed: %', auth_user_info.email_confirmed_at;
      RAISE NOTICE '   - Created: %', auth_user_info.created_at;
    END IF;
  END;
  
  -- Public users 테이블 확인
  DECLARE
    public_user_count INTEGER;
    public_user_info RECORD;
  BEGIN
    SELECT COUNT(*) INTO public_user_count FROM public.users WHERE email = check_email;
    RAISE NOTICE '2. public.users 테이블: % 개의 레코드', public_user_count;
    
    IF public_user_count > 0 THEN
      SELECT id, email, nickname, created_at 
      INTO public_user_info 
      FROM public.users 
      WHERE email = check_email;
      
      RAISE NOTICE '   - ID: %', public_user_info.id;
      RAISE NOTICE '   - Email: %', public_user_info.email;
      RAISE NOTICE '   - Nickname: %', public_user_info.nickname;
      RAISE NOTICE '   - Created: %', public_user_info.created_at;
    END IF;
  END;
  
  -- 관련 데이터 확인 (Auth 사용자가 있는 경우)
  DECLARE
    target_user_id UUID;
    ledger_count INTEGER;
    family_member_count INTEGER;
    owned_family_count INTEGER;
  BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = check_email;
    
    IF target_user_id IS NOT NULL THEN
      SELECT COUNT(*) INTO ledger_count FROM public.ledger_entries WHERE user_id = target_user_id;
      SELECT COUNT(*) INTO family_member_count FROM public.family_members WHERE user_id = target_user_id;
      SELECT COUNT(*) INTO owned_family_count FROM public.families WHERE owner_id = target_user_id;
      
      RAISE NOTICE '3. 관련 데이터:';
      RAISE NOTICE '   - 가계부 기록: % 개', ledger_count;
      RAISE NOTICE '   - 가족 멤버십: % 개', family_member_count;
      RAISE NOTICE '   - 소유한 가족: % 개', owned_family_count;
    END IF;
  END;
  
  -- 결론 및 권장사항
  DECLARE
    auth_exists BOOLEAN;
    public_exists BOOLEAN;
  BEGIN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = check_email) INTO auth_exists;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = check_email) INTO public_exists;
    
    RAISE NOTICE '=== 진단 결과 ===';
    
    IF auth_exists OR public_exists THEN
      RAISE NOTICE '문제: 사용자 데이터가 남아있어 재가입 불가';
      RAISE NOTICE '해결책: 아래 삭제 SQL을 실행하세요';
    ELSE
      RAISE NOTICE '상태: 사용자 데이터가 완전히 삭제됨 - 재가입 가능해야 함';
      RAISE NOTICE '재가입이 안 되면 이메일 확인 설정을 체크하세요';
    END IF;
  END;
END $$;

-- 2. 완전 삭제가 필요한 경우 실행할 SQL
-- (위 진단에서 데이터가 남아있다고 나온 경우에만 실행)

/*
-- 아래 주석을 해제하고 이메일을 변경한 후 실행하세요

DO $$
DECLARE
  target_email TEXT := '문제되는이메일@example.com'; -- 실제 이메일로 변경
  target_user_id UUID;
BEGIN
  -- 사용자 ID 찾기
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    -- Auth에 없으면 Public만 확인
    SELECT id INTO target_user_id FROM public.users WHERE email = target_email;
    
    IF target_user_id IS NOT NULL THEN
      DELETE FROM public.users WHERE email = target_email;
      RAISE NOTICE 'Public 사용자 삭제 완료';
    END IF;
    
    RETURN;
  END IF;
  
  RAISE NOTICE '사용자 삭제 시작: % (%)', target_email, target_user_id;
  
  -- 관련 데이터 삭제
  DELETE FROM public.ledger_entries WHERE user_id = target_user_id;
  DELETE FROM public.family_members WHERE user_id = target_user_id;
  
  -- 소유한 빈 가족들 삭제
  DELETE FROM public.families 
  WHERE owner_id = target_user_id 
    AND id NOT IN (SELECT DISTINCT family_id FROM public.family_members);
  
  -- Public 사용자 삭제
  DELETE FROM public.users WHERE id = target_user_id;
  
  -- Auth 사용자 삭제
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RAISE NOTICE '사용자 완전 삭제 완료!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '삭제 중 오류 발생: %', SQLERRM;
END $$;
*/