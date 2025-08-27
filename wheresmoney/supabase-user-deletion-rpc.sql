-- 사용자 자신의 계정을 삭제할 수 있는 RPC 함수
CREATE OR REPLACE FUNCTION delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 현재 인증된 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 인증되지 않은 경우 에러
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- auth.users 테이블에서 사용자 삭제
  -- CASCADE로 인해 관련 데이터도 자동 삭제됨
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- 인증된 사용자만 자신의 계정을 삭제할 수 있도록 권한 설정
GRANT EXECUTE ON FUNCTION delete_current_user() TO authenticated;