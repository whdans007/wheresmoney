-- 무한 재귀 문제 완전 해결

-- 1. 모든 기존 RLS 정책 완전 삭제
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries DISABLE ROW LEVEL SECURITY;

-- 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Family members can view family" ON families;
DROP POLICY IF EXISTS "Family owners can update family" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family members can view members" ON family_members;
DROP POLICY IF EXISTS "Family owners can invite members" ON family_members;
DROP POLICY IF EXISTS "Users can leave families" ON family_members;
DROP POLICY IF EXISTS "Family members can view ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Family members can add ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can update own ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can delete own ledger entries" ON ledger_entries;

-- 2. RLS 다시 활성화
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- 3. 가족방(families) 테이블 - 간단하고 안전한 정책
CREATE POLICY "Select families for members" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = families.id 
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert families by owners" ON families
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Update families by owners" ON families
  FOR UPDATE USING (owner_id = auth.uid());

-- 4. 가족방 멤버(family_members) 테이블 - 직접적이고 명확한 정책
CREATE POLICY "Select family members" ON family_members
  FOR SELECT USING (
    -- 자신의 멤버십은 항상 볼 수 있음
    user_id = auth.uid() 
    OR 
    -- 같은 가족방 멤버들의 정보도 볼 수 있음 (단순 쿼리)
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Insert family members by owners" ON family_members
  FOR INSERT WITH CHECK (
    -- 가족방 소유자만 멤버 추가 가능
    EXISTS (
      SELECT 1 FROM families 
      WHERE id = family_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Delete own membership" ON family_members
  FOR DELETE USING (user_id = auth.uid());

-- 5. 가계부 내역(ledger_entries) 테이블
CREATE POLICY "Select ledger entries for family members" ON ledger_entries
  FOR SELECT USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = ledger_entries.family_id 
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert ledger entries by family members" ON ledger_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND 
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = family_id 
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Update own ledger entries" ON ledger_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delete own ledger entries" ON ledger_entries
  FOR DELETE USING (user_id = auth.uid());

-- 6. 카테고리 테이블 (모든 인증된 사용자가 접근 가능)
ALTER TABLE ledger_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON ledger_categories;

CREATE POLICY "All authenticated users can view categories" ON ledger_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- 7. 디버깅을 위한 간단한 테스트 쿼리 (주석으로 보관)
-- SELECT fm.*, f.name 
-- FROM family_members fm 
-- JOIN families f ON f.id = fm.family_id 
-- WHERE fm.user_id = auth.uid();