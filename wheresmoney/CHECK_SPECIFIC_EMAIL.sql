-- whdans007@hanmail.net 이메일의 모든 데이터 상태 확인

DO $$
DECLARE
  target_email TEXT := 'whdans007@hanmail.net';
BEGIN
  RAISE NOTICE '=== % 이메일 상태 확인 ===', target_email;
  
  -- 1. auth.users 테이블 확인
  DECLARE
    auth_count INTEGER;
    auth_info RECORD;
  BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email = target_email;
    RAISE NOTICE '1. auth.users: % 개', auth_count;
    
    IF auth_count > 0 THEN
      FOR auth_info IN 
        SELECT id, email, email_confirmed_at, created_at, updated_at
        FROM auth.users 
        WHERE email = target_email
      LOOP
        RAISE NOTICE '   ID: %', auth_info.id;
        RAISE NOTICE '   Email: %', auth_info.email;
        RAISE NOTICE '   Confirmed: %', auth_info.email_confirmed_at;
        RAISE NOTICE '   Created: %', auth_info.created_at;
        RAISE NOTICE '   Updated: %', auth_info.updated_at;
      END LOOP;
    END IF;
  END;
  
  -- 2. public.users 테이블 확인
  DECLARE
    public_count INTEGER;
    public_info RECORD;
  BEGIN
    SELECT COUNT(*) INTO public_count FROM public.users WHERE email = target_email;
    RAISE NOTICE '2. public.users: % 개', public_count;
    
    IF public_count > 0 THEN
      FOR public_info IN 
        SELECT id, email, nickname, created_at, updated_at
        FROM public.users 
        WHERE email = target_email
      LOOP
        RAISE NOTICE '   ID: %', public_info.id;
        RAISE NOTICE '   Email: %', public_info.email;
        RAISE NOTICE '   Nickname: %', public_info.nickname;
        RAISE NOTICE '   Created: %', public_info.created_at;
        RAISE NOTICE '   Updated: %', public_info.updated_at;
      END LOOP;
    END IF;
  END;
  
  -- 3. 관련 데이터 확인 (혹시 사용자 ID가 있다면)
  DECLARE
    any_user_id UUID;
  BEGIN
    -- Auth에서 먼저 찾고, 없으면 Public에서 찾기
    SELECT id INTO any_user_id FROM auth.users WHERE email = target_email;
    
    IF any_user_id IS NULL THEN
      SELECT id INTO any_user_id FROM public.users WHERE email = target_email;
    END IF;
    
    IF any_user_id IS NOT NULL THEN
      RAISE NOTICE '3. 관련 데이터 (사용자 ID: %)', any_user_id;
      
      DECLARE
        ledger_count INTEGER;
        family_count INTEGER;
        member_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO ledger_count FROM public.ledger_entries WHERE user_id = any_user_id;
        SELECT COUNT(*) INTO family_count FROM public.families WHERE owner_id = any_user_id;
        SELECT COUNT(*) INTO member_count FROM public.family_members WHERE user_id = any_user_id;
        
        RAISE NOTICE '   가계부 기록: %', ledger_count;
        RAISE NOTICE '   소유 가족: %', family_count;
        RAISE NOTICE '   멤버십: %', member_count;
      END;
    ELSE
      RAISE NOTICE '3. 관련 데이터 없음 - 깨끗한 상태';
    END IF;
  END;
  
  -- 4. 결론
  DECLARE
    auth_exists BOOLEAN;
    public_exists BOOLEAN;
  BEGIN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = target_email) INTO auth_exists;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = target_email) INTO public_exists;
    
    RAISE NOTICE '=== 결론 ===';
    
    IF NOT auth_exists AND NOT public_exists THEN
      RAISE NOTICE '✅ 완전히 깨끗한 상태 - 재가입이 가능해야 함';
      RAISE NOTICE '재가입이 안 되면 앱 코드의 중복 확인 로직을 점검하세요';
    ELSE
      RAISE NOTICE '❌ 데이터가 남아있음 - 삭제 필요';
      RAISE NOTICE 'Auth 테이블: %', CASE WHEN auth_exists THEN '있음' ELSE '없음' END;
      RAISE NOTICE 'Public 테이블: %', CASE WHEN public_exists THEN '있음' ELSE '없음' END;
    END IF;
  END;
END $$;

-- 만약 데이터가 남아있다면 아래 주석을 해제하고 실행하세요
/*
-- 완전 삭제 (필요시에만 사용)
DO $$
DECLARE
  cleanup_email TEXT := 'whdans007@hanmail.net';
  user_id_to_delete UUID;
BEGIN
  -- Auth 테이블에서 사용자 ID 찾기
  SELECT id INTO user_id_to_delete FROM auth.users WHERE email = cleanup_email;
  
  IF user_id_to_delete IS NOT NULL THEN
    -- 관련 데이터 삭제
    DELETE FROM public.ledger_entries WHERE user_id = user_id_to_delete;
    DELETE FROM public.family_members WHERE user_id = user_id_to_delete;
    DELETE FROM public.families WHERE owner_id = user_id_to_delete;
    DELETE FROM public.users WHERE id = user_id_to_delete;
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE '✅ % 완전 삭제 완료', cleanup_email;
  ELSE
    -- Public 테이블만 확인
    SELECT id INTO user_id_to_delete FROM public.users WHERE email = cleanup_email;
    
    IF user_id_to_delete IS NOT NULL THEN
      DELETE FROM public.ledger_entries WHERE user_id = user_id_to_delete;
      DELETE FROM public.family_members WHERE user_id = user_id_to_delete;
      DELETE FROM public.families WHERE owner_id = user_id_to_delete;
      DELETE FROM public.users WHERE id = user_id_to_delete;
      
      RAISE NOTICE '✅ Public 테이블 % 삭제 완료', cleanup_email;
    ELSE
      RAISE NOTICE 'ℹ️  % 데이터 없음', cleanup_email;
    END IF;
  END IF;
END $$;
*/