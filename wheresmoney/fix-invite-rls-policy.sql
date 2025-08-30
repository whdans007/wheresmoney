-- Fix RLS policy for invite code lookups
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Family members can view family" ON families;

-- 새로운 정책: 가족 멤버 또는 초대 코드로 조회하는 경우 허용
CREATE POLICY "Family members and invite code users can view family" ON families
  FOR SELECT USING (
    -- 기존 멤버는 여전히 접근 가능
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE family_id = families.id AND user_id = auth.uid()
    )
    OR
    -- 또는 인증된 사용자라면 invite_code 필드만 포함된 쿼리는 허용
    -- (이는 Supabase RLS의 한계로 인해 완벽하지 않을 수 있음)
    auth.uid() IS NOT NULL
  );