-- RLS 정책 무한 재귀 문제 해결

-- 1. 기존 문제가 있는 정책들 삭제
DROP POLICY IF EXISTS "Family members can view family" ON families;
DROP POLICY IF EXISTS "Family members can view members" ON family_members;
DROP POLICY IF EXISTS "Family members can view ledger entries" ON ledger_entries;

-- 2. families 테이블 정책 수정 (재귀 방지)
CREATE POLICY "Family members can view family" ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- 3. family_members 테이블 정책 수정 (재귀 방지)
CREATE POLICY "Family members can view members" ON family_members
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm 
      WHERE fm.user_id = auth.uid()
    )
  );

-- 4. 가족방 멤버 추가 정책 (소유자만)
CREATE POLICY "Family owners can invite members" ON family_members
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT id FROM families 
      WHERE owner_id = auth.uid()
    )
  );

-- 5. 자신의 멤버십 관리 정책
CREATE POLICY "Users can leave families" ON family_members
  FOR DELETE USING (user_id = auth.uid());

-- 6. 가계부 내역 정책 수정
CREATE POLICY "Family members can view ledger entries" ON ledger_entries
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm 
      WHERE fm.user_id = auth.uid()
    )
  );

-- 7. 가계부 내역 추가 정책
CREATE POLICY "Family members can add ledger entries" ON ledger_entries
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM family_members fm 
      WHERE fm.user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- 8. 가계부 내역 수정/삭제 정책
CREATE POLICY "Users can update own ledger entries" ON ledger_entries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    family_id IN (
      SELECT id FROM families 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own ledger entries" ON ledger_entries
  FOR DELETE USING (
    user_id = auth.uid() OR 
    family_id IN (
      SELECT id FROM families 
      WHERE owner_id = auth.uid()
    )
  );

-- 9. 가족방 생성 정책
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 10. 가족방 수정 정책은 이미 올바르게 설정되어 있음 (확인)
-- CREATE POLICY "Family owners can update family" ON families
--   FOR UPDATE USING (owner_id = auth.uid());

-- 11. 카테고리는 모든 인증된 사용자가 볼 수 있도록
ALTER TABLE ledger_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories" ON ledger_categories
  FOR SELECT USING (auth.role() = 'authenticated');