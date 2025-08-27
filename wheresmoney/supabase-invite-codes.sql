-- 가족 초대 코드 테이블 생성

-- 1. invite_codes 테이블 생성
CREATE TABLE invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE
);

-- 2. 인덱스 생성
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_family_id ON invite_codes(family_id);
CREATE INDEX idx_invite_codes_expires_at ON invite_codes(expires_at);

-- 3. RLS 활성화
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 - 가족 구성원만 초대 코드 생성/조회 가능
CREATE POLICY "Family members can view invite codes" ON invite_codes
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family owners can create invite codes" ON invite_codes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = family_id 
      AND f.owner_id = auth.uid()
    )
  );

-- 5. 만료된 초대 코드 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_invite_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 만료된 초대 코드 삭제 (30일 이상 된 것)
  DELETE FROM invite_codes 
  WHERE expires_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up expired invite codes';
END;
$$;

-- 6. 초대 코드 생성 함수 (중복 방지)
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- 6자리 랜덤 코드 생성
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- 코드 중복 확인
    SELECT EXISTS(
      SELECT 1 FROM invite_codes 
      WHERE code = new_code 
      AND expires_at > NOW()
      AND is_used = FALSE
    ) INTO code_exists;
    
    -- 중복이 없으면 반환
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- 7. 테이블 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invite_codes'
ORDER BY ordinal_position;