-- Admin 권한으로 사용자 완전 삭제 RPC 함수
-- 이 함수는 auth.users를 포함해 모든 데이터를 삭제합니다

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  deletion_results json := '{}';
  deleted_count INTEGER;
  family_record RECORD;
  new_owner_id UUID;
BEGIN
  -- 삭제 로그 시작
  deletion_results := json_build_object('started', now(), 'user_id', target_user_id);
  
  -- 1. 가계부 기록 삭제
  DELETE FROM public.ledger_entries WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  deletion_results := deletion_results || json_build_object('ledger_entries', deleted_count);
  
  -- 2. 가족 멤버십 삭제
  DELETE FROM public.family_members WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  deletion_results := deletion_results || json_build_object('family_members', deleted_count);
  
  -- 3. 소유한 가족 처리 (소유권 이전 또는 삭제)
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
    ELSE
      -- 빈 가족 삭제
      DELETE FROM public.ledger_entries WHERE family_id = family_record.id;
      DELETE FROM public.family_members WHERE family_id = family_record.id;
      DELETE FROM public.families WHERE id = family_record.id;
    END IF;
  END LOOP;
  
  -- 4. Public 프로필 삭제
  DELETE FROM public.users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  deletion_results := deletion_results || json_build_object('public_users', deleted_count);
  
  -- 5. Auth 사용자 삭제 (가장 중요!)
  DELETE FROM auth.users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  deletion_results := deletion_results || json_build_object('auth_users', deleted_count);
  
  -- 최종 결과
  deletion_results := deletion_results || json_build_object('completed', now(), 'success', true);
  
  RETURN deletion_results;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', target_user_id,
      'completed', now()
    );
END;
$$;

-- 현재 로그인된 사용자 삭제용 랩퍼 함수
CREATE OR REPLACE FUNCTION delete_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 현재 로그인된 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '로그인된 사용자가 없습니다.');
  END IF;
  
  -- Admin 삭제 함수 호출
  RETURN admin_delete_user(current_user_id);
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_current_user() TO authenticated;