-- 완전한 초대 시스템 마이그레이션
-- Supabase SQL Editor에서 이 전체를 복사해서 실행하세요

-- 1단계: invite_code 컬럼 추가
ALTER TABLE families ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 2단계: 기존 가족방들에 고유한 초대 코드 생성
DO $$
DECLARE
    fam RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR fam IN SELECT id FROM families WHERE invite_code IS NULL LOOP
        LOOP
            -- 6자리 랜덤 코드 생성
            new_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
            
            -- 코드 중복 확인
            SELECT EXISTS(SELECT 1 FROM families WHERE invite_code = new_code) INTO code_exists;
            
            -- 중복이 없으면 사용
            IF NOT code_exists THEN
                UPDATE families SET invite_code = new_code WHERE id = fam.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 3단계: 제약 조건 설정
ALTER TABLE families ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE families ADD CONSTRAINT IF NOT EXISTS families_invite_code_unique UNIQUE (invite_code);

-- 4단계: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_families_invite_code ON families(invite_code);

-- 5단계: RPC 함수 생성 (RLS 우회)
CREATE OR REPLACE FUNCTION join_family_by_invite_code(invite_code_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- 높은 권한으로 실행
AS $$
DECLARE
  current_user_id UUID;
  target_family_id UUID;
  target_family_owner_id UUID;
  target_family_name TEXT;
  existing_member_count INT;
  result JSON;
BEGIN
  -- 현재 사용자 가져오기
  current_user_id := auth.uid();
  
  -- 인증 확인
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '로그인이 필요합니다.'
    );
  END IF;
  
  -- 초대 코드로 가족방 찾기
  SELECT id, owner_id, name 
  INTO target_family_id, target_family_owner_id, target_family_name
  FROM families 
  WHERE invite_code = invite_code_param;
  
  -- 가족방 존재 확인
  IF target_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '유효하지 않은 초대 코드입니다.'
    );
  END IF;
  
  -- 본인 소유 가족방 확인
  IF target_family_owner_id = current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', '본인이 소유한 가족방에는 참여할 수 없습니다.',
      'familyName', target_family_name
    );
  END IF;
  
  -- 이미 멤버인지 확인
  SELECT COUNT(*) INTO existing_member_count
  FROM family_members
  WHERE family_id = target_family_id AND user_id = current_user_id;
  
  IF existing_member_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '이미 이 가족의 구성원입니다.',
      'familyName', target_family_name
    );
  END IF;
  
  -- 가족 구성원으로 추가
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (target_family_id, current_user_id, 'member');
  
  RETURN json_build_object(
    'success', true,
    'familyId', target_family_id,
    'familyName', target_family_name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '초대 시스템 마이그레이션이 완료되었습니다!';
  RAISE NOTICE '- families 테이블에 invite_code 컬럼 추가됨';
  RAISE NOTICE '- 기존 가족방들에 초대 코드 생성됨';
  RAISE NOTICE '- join_family_by_invite_code RPC 함수 생성됨';
END $$;