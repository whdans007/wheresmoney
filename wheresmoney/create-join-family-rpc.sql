-- Create RPC function to handle family joining with invite code
-- This bypasses RLS restrictions
CREATE OR REPLACE FUNCTION join_family_by_invite_code(invite_code_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
AS $$
DECLARE
  current_user_id UUID;
  target_family_id UUID;
  target_family_owner_id UUID;
  existing_member_count INT;
  result JSON;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '로그인이 필요합니다.'
    );
  END IF;
  
  -- Find family by invite code
  SELECT id, owner_id INTO target_family_id, target_family_owner_id
  FROM families 
  WHERE invite_code = invite_code_param;
  
  -- Check if family exists
  IF target_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '유효하지 않은 초대 코드입니다.'
    );
  END IF;
  
  -- Check if user is the owner
  IF target_family_owner_id = current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', '본인이 소유한 가족방에는 참여할 수 없습니다.'
    );
  END IF;
  
  -- Check if already a member
  SELECT COUNT(*) INTO existing_member_count
  FROM family_members
  WHERE family_id = target_family_id AND user_id = current_user_id;
  
  IF existing_member_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '이미 이 가족의 구성원입니다.'
    );
  END IF;
  
  -- Add user to family
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (target_family_id, current_user_id, 'member');
  
  RETURN json_build_object(
    'success', true,
    'familyId', target_family_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;