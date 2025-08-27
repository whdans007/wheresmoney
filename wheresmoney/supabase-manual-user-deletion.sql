-- 수동으로 사용자를 단계별로 삭제하는 SQL (Database error 해결용)
-- "Database error deleting user" 오류가 발생할 때 사용하세요.

-- 1단계: 삭제할 사용자 정보 확인
-- 먼저 아래 쿼리로 사용자 정보를 확인하세요
-- SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = '사용자이메일@example.com';

-- 2단계: 사용자 ID를 변수로 설정하고 관련 데이터 단계별 삭제
DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := '여기에_삭제할_이메일@example.com'; -- 이 부분을 실제 이메일로 변경하세요
BEGIN
  -- 사용자 ID 찾기
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found with email: %', target_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user ID: % for email: %', target_user_id, target_email;
  
  -- 단계별 데이터 삭제 시작
  
  -- 2-1. ledger_entries 삭제 (가계부 기록)
  DELETE FROM public.ledger_entries WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted ledger entries for user: %', target_user_id;
  
  -- 2-2. family_members에서 해당 사용자 제거
  DELETE FROM public.family_members WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted family memberships for user: %', target_user_id;
  
  -- 2-3. 사용자가 소유한 가족들 처리
  -- 다른 멤버가 있는 경우 소유권 이전, 없는 경우 가족 삭제
  DECLARE
    family_record RECORD;
    new_owner_id UUID;
  BEGIN
    FOR family_record IN 
      SELECT id, name FROM public.families WHERE owner_id = target_user_id
    LOOP
      -- 해당 가족의 다른 멤버 찾기
      SELECT user_id INTO new_owner_id 
      FROM public.family_members 
      WHERE family_id = family_record.id AND user_id != target_user_id 
      LIMIT 1;
      
      IF new_owner_id IS NOT NULL THEN
        -- 다른 멤버가 있으면 소유권 이전
        UPDATE public.families 
        SET owner_id = new_owner_id, updated_at = NOW() 
        WHERE id = family_record.id;
        
        -- 새 소유자의 역할을 owner로 변경
        UPDATE public.family_members 
        SET role = 'owner' 
        WHERE family_id = family_record.id AND user_id = new_owner_id;
        
        RAISE NOTICE 'Transferred ownership of family "%" to user: %', family_record.name, new_owner_id;
      ELSE
        -- 다른 멤버가 없으면 가족의 모든 데이터 삭제
        DELETE FROM public.ledger_entries WHERE family_id = family_record.id;
        DELETE FROM public.family_members WHERE family_id = family_record.id;
        DELETE FROM public.families WHERE id = family_record.id;
        RAISE NOTICE 'Deleted empty family: %', family_record.name;
      END IF;
    END LOOP;
  END;
  
  -- 2-4. public.users에서 사용자 프로필 삭제
  DELETE FROM public.users WHERE id = target_user_id;
  RAISE NOTICE 'Deleted user profile for: %', target_user_id;
  
  -- 2-5. 마지막으로 auth.users에서 삭제 (가장 중요!)
  DELETE FROM auth.users WHERE id = target_user_id;
  RAISE NOTICE 'Successfully deleted auth user: % (%)', target_email, target_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    RAISE NOTICE 'You may need to manually check for remaining foreign key constraints';
END $$;