-- 탈퇴 후 재가입 안 되는 문제 완전 해결용 SQL
-- 모든 관련 데이터를 완전히 정리하여 재가입을 가능하게 합니다

-- 사용법:
-- 1. 아래 이메일 주소를 실제 문제되는 이메일로 변경
-- 2. Supabase SQL Editor에서 전체 스크립트 실행

DO $$
DECLARE
  problem_email TEXT := '여기에_문제되는_이메일@example.com'; -- 이 부분을 실제 이메일로 변경하세요
  auth_user_id UUID;
  public_user_id UUID;
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== 완전 사용자 정리 시작: % ===', problem_email;
  
  -- 1. Auth 테이블에서 사용자 확인 및 관련 데이터 삭제
  SELECT id INTO auth_user_id FROM auth.users WHERE email = problem_email;
  
  IF auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'Auth 사용자 발견: %', auth_user_id;
    
    -- 1-1. 가계부 기록 삭제
    DELETE FROM public.ledger_entries WHERE user_id = auth_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '가계부 기록 삭제: % 개', deleted_count;
    
    -- 1-2. 가족 멤버십 삭제
    DELETE FROM public.family_members WHERE user_id = auth_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '가족 멤버십 삭제: % 개', deleted_count;
    
    -- 1-3. 소유한 가족들 처리 (소유권 이전 또는 삭제)
    DECLARE
      family_rec RECORD;
      new_owner_id UUID;
      family_deleted_count INTEGER := 0;
      family_transferred_count INTEGER := 0;
    BEGIN
      FOR family_rec IN 
        SELECT id, name FROM public.families WHERE owner_id = auth_user_id
      LOOP
        -- 다른 멤버가 있는지 확인
        SELECT user_id INTO new_owner_id
        FROM public.family_members 
        WHERE family_id = family_rec.id AND user_id != auth_user_id
        LIMIT 1;
        
        IF new_owner_id IS NOT NULL THEN
          -- 소유권 이전
          UPDATE public.families 
          SET owner_id = new_owner_id, updated_at = NOW()
          WHERE id = family_rec.id;
          
          UPDATE public.family_members 
          SET role = 'owner'
          WHERE family_id = family_rec.id AND user_id = new_owner_id;
          
          family_transferred_count := family_transferred_count + 1;
          RAISE NOTICE '가족 "%" 소유권 이전: %', family_rec.name, new_owner_id;
        ELSE
          -- 빈 가족 삭제
          DELETE FROM public.ledger_entries WHERE family_id = family_rec.id;
          DELETE FROM public.family_members WHERE family_id = family_rec.id;
          DELETE FROM public.families WHERE id = family_rec.id;
          
          family_deleted_count := family_deleted_count + 1;
          RAISE NOTICE '빈 가족 "%" 삭제', family_rec.name;
        END IF;
      END LOOP;
      
      RAISE NOTICE '가족 처리 완료 - 이전: %개, 삭제: %개', family_transferred_count, family_deleted_count;
    END;
    
    -- 1-4. Public 사용자 프로필 삭제
    DELETE FROM public.users WHERE id = auth_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Public 프로필 삭제: % 개', deleted_count;
    
    -- 1-5. Auth 사용자 삭제
    DELETE FROM auth.users WHERE id = auth_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Auth 사용자 삭제: % 개', deleted_count;
    
  ELSE
    RAISE NOTICE 'Auth 테이블에서 사용자를 찾지 못함';
  END IF;
  
  -- 2. Public 테이블에서만 남아있는 데이터 확인 및 삭제
  SELECT id INTO public_user_id FROM public.users WHERE email = problem_email;
  
  IF public_user_id IS NOT NULL THEN
    RAISE NOTICE 'Public 전용 사용자 발견: %', public_user_id;
    
    -- Public 테이블 관련 데이터 삭제
    DELETE FROM public.ledger_entries WHERE user_id = public_user_id;
    DELETE FROM public.family_members WHERE user_id = public_user_id;
    DELETE FROM public.families WHERE owner_id = public_user_id;
    DELETE FROM public.users WHERE id = public_user_id;
    
    RAISE NOTICE 'Public 전용 데이터 삭제 완료';
  END IF;
  
  -- 3. 최종 확인
  DECLARE
    final_auth_count INTEGER;
    final_public_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO final_auth_count FROM auth.users WHERE email = problem_email;
    SELECT COUNT(*) INTO final_public_count FROM public.users WHERE email = problem_email;
    
    RAISE NOTICE '=== 정리 완료 ===';
    RAISE NOTICE 'Auth 테이블 남은 데이터: %', final_auth_count;
    RAISE NOTICE 'Public 테이블 남은 데이터: %', final_public_count;
    
    IF final_auth_count = 0 AND final_public_count = 0 THEN
      RAISE NOTICE '✅ 성공: % 이메일로 재가입 가능합니다!', problem_email;
    ELSE
      RAISE NOTICE '❌ 경고: 일부 데이터가 남아있을 수 있습니다';
    END IF;
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ 오류 발생: %', SQLERRM;
    RAISE NOTICE '수동 삭제가 필요할 수 있습니다';
END $$;

-- 4. 추가 정리 (혹시 놓친 데이터가 있는 경우)
-- 아래는 이메일로 모든 테이블을 검색하는 추가 정리 스크립트

/*
-- 이메일 기반 모든 데이터 검색 및 삭제 (필요시 주석 해제)
DO $$
DECLARE
  cleanup_email TEXT := '여기에_문제되는_이메일@example.com'; -- 실제 이메일로 변경
BEGIN
  -- 이메일이 포함된 모든 레코드 삭제
  DELETE FROM public.users WHERE email = cleanup_email;
  DELETE FROM auth.users WHERE email = cleanup_email;
  
  RAISE NOTICE '이메일 기반 추가 정리 완료: %', cleanup_email;
END $$;
*/