-- 가족방 생성(INSERT) 정책 문제 해결

-- 1. 기존 families 정책들 확인 및 수정
DROP POLICY IF EXISTS "families_insert_policy" ON families;
DROP POLICY IF EXISTS "families_select_policy" ON families;
DROP POLICY IF EXISTS "families_update_policy" ON families;

-- 2. 새로운 families 정책들 생성
-- INSERT: 인증된 사용자가 자신을 소유자로 하는 가족방 생성 가능
CREATE POLICY "families_insert_policy" ON families
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND owner_id = auth.uid()
  );

-- SELECT: 자신이 멤버인 가족방만 조회 가능
CREATE POLICY "families_select_policy" ON families
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND (
      owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM family_members fm 
        WHERE fm.family_id = families.id 
        AND fm.user_id = auth.uid()
      )
    )
  );

-- UPDATE: 소유자만 가족방 정보 수정 가능
CREATE POLICY "families_update_policy" ON families
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND owner_id = auth.uid()
  );

-- 3. family_members INSERT 정책도 수정
DROP POLICY IF EXISTS "family_members_insert_policy" ON family_members;

CREATE POLICY "family_members_insert_policy" ON family_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
      -- 가족방 소유자가 멤버 추가하는 경우
      EXISTS (
        SELECT 1 FROM families 
        WHERE id = family_id 
        AND owner_id = auth.uid()
      )
      OR
      -- 자신이 가족방에 참여하는 경우 (초대 수락)
      user_id = auth.uid()
    )
  );

-- 4. 디버깅용: 현재 정책 상태 확인 쿼리 (주석 해제해서 사용)
-- SELECT tablename, policyname, cmd, permissive, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('families', 'family_members')
-- ORDER BY tablename, policyname;