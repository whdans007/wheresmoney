-- 강제로 whdans007@hanmail.net 계정을 완전히 삭제
-- 회원 탈퇴가 제대로 안 된 경우 사용

DO $$
DECLARE
  target_email TEXT := 'whdans007@hanmail.net';
  target_user_id UUID;
  deletion_log TEXT := '';
  deleted_count INTEGER;
  family_record RECORD;
  new_owner_id UUID;
  auth_check INTEGER;
  public_check INTEGER;
BEGIN
  RAISE NOTICE '=== % 강제 삭제 시작 ===', target_email;
  
  -- 1. Auth 테이블에서 사용자 ID 찾기
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    -- Auth에 없으면 Public 테이블 확인
    SELECT id INTO target_user_id FROM public.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
      RAISE NOTICE '사용자를 찾을 수 없습니다: %', target_email;
      RETURN;
    ELSE
      RAISE NOTICE 'Public 테이블에서만 발견: %', target_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'Auth 테이블에서 발견: %', target_user_id;
  END IF;
  
  -- 2. 관련 데이터 삭제 (순서 중요!)
  
  -- 2-1. 가계부 기록 삭제
  DELETE FROM public.ledger_entries WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '가계부 기록 삭제: % 개', deleted_count;
  deletion_log := deletion_log || 'ledger_entries: ' || deleted_count || ', ';
  
  -- 2-2. 가족 멤버십 삭제
  DELETE FROM public.family_members WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '가족 멤버십 삭제: % 개', deleted_count;
  deletion_log := deletion_log || 'family_members: ' || deleted_count || ', ';
  
  -- 2-3. 소유한 가족 처리 (소유권 이전 또는 삭제)
  FOR family_record IN 
    SELECT id, name FROM public.families WHERE owner_id = target_user_id
  LOOP
    -- 다른 멤버 찾기
    SELECT user_id INTO new_owner_id 
    FROM public.family_members 
    WHERE family_id = family_record.id AND user_id != target_user_id
    LIMIT 1;
    
    IF new_owner_id IS NOT NULL THEN
      -- 소유권 이전
      UPDATE public.families 
      SET owner_id = new_owner_id, updated_at = NOW()
      WHERE id = family_record.id;
      
      UPDATE public.family_members 
      SET role = 'owner'
      WHERE family_id = family_record.id AND user_id = new_owner_id;
      
      RAISE NOTICE '가족 "%" 소유권 이전: %', family_record.name, new_owner_id;
    ELSE
      -- 빈 가족 삭제
      DELETE FROM public.ledger_entries WHERE family_id = family_record.id;
      DELETE FROM public.family_members WHERE family_id = family_record.id;
      DELETE FROM public.families WHERE id = family_record.id;
      RAISE NOTICE '빈 가족 "%" 삭제', family_record.name;
    END IF;
  END LOOP;
  
  -- 2-4. Public users 테이블에서 삭제
  DELETE FROM public.users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Public 프로필 삭제: % 개', deleted_count;
  deletion_log := deletion_log || 'public.users: ' || deleted_count || ', ';
  
  -- 2-5. Auth users 테이블에서 삭제 (가장 중요!)
  DELETE FROM auth.users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Auth 사용자 삭제: % 개', deleted_count;
  deletion_log := deletion_log || 'auth.users: ' || deleted_count;
  
  -- 3. 최종 확인
  SELECT COUNT(*) INTO auth_check FROM auth.users WHERE email = target_email;
  SELECT COUNT(*) INTO public_check FROM public.users WHERE email = target_email;
  
  RAISE NOTICE '=== 삭제 완료 ===';
  RAISE NOTICE 'Auth 테이블 남은 데이터: %', auth_check;
  RAISE NOTICE 'Public 테이블 남은 데이터: %', public_check;
  RAISE NOTICE '삭제 로그: %', deletion_log;
  
  IF auth_check = 0 AND public_check = 0 THEN
    RAISE NOTICE '✅ 완전 삭제 성공! 재가입이 가능합니다.';
  ELSE
    RAISE NOTICE '❌ 일부 데이터가 남아있을 수 있습니다.';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ 오류 발생: %', SQLERRM;
    RAISE NOTICE '수동으로 다음 쿼리를 실행하세요:';
    RAISE NOTICE 'DELETE FROM auth.users WHERE email = ''%'';', target_email;
END $$;