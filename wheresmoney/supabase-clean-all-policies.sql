-- 모든 기존 정책을 완전히 정리하고 새로 생성

-- 1. RLS 비활성화
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_categories DISABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책들 삭제 (이름을 정확히 확인해서 삭제)
-- families 테이블 정책들
DROP POLICY IF EXISTS "Family members can view family" ON families;
DROP POLICY IF EXISTS "Select families for members" ON families;
DROP POLICY IF EXISTS "Insert families by owners" ON families;
DROP POLICY IF EXISTS "Update families by owners" ON families;
DROP POLICY IF EXISTS "Family owners can update family" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;

-- family_members 테이블 정책들
DROP POLICY IF EXISTS "Family members can view members" ON family_members;
DROP POLICY IF EXISTS "Select family members" ON family_members;
DROP POLICY IF EXISTS "Insert family members by owners" ON family_members;
DROP POLICY IF EXISTS "Delete own membership" ON family_members;
DROP POLICY IF EXISTS "Family owners can invite members" ON family_members;
DROP POLICY IF EXISTS "Users can leave families" ON family_members;

-- ledger_entries 테이블 정책들
DROP POLICY IF EXISTS "Family members can view ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Select ledger entries for family members" ON ledger_entries;
DROP POLICY IF EXISTS "Insert ledger entries by family members" ON ledger_entries;
DROP POLICY IF EXISTS "Update own ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Delete own ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Family members can add ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can update own ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can delete own ledger entries" ON ledger_entries;

-- ledger_categories 테이블 정책들
DROP POLICY IF EXISTS "Authenticated users can view categories" ON ledger_categories;
DROP POLICY IF EXISTS "All authenticated users can view categories" ON ledger_categories;

-- 3. 현재 존재하는 모든 정책 확인 (디버깅용 쿼리)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('families', 'family_members', 'ledger_entries', 'ledger_categories');

-- 4. 잠시 대기 후 RLS 다시 활성화
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_categories ENABLE ROW LEVEL SECURITY;

-- 5. 새로운 간단한 정책들 생성 (고유한 이름 사용)
CREATE POLICY "families_select_policy" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = families.id 
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "families_insert_policy" ON families
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_update_policy" ON families
  FOR UPDATE USING (owner_id = auth.uid());

-- 6. family_members 테이블 정책 (재귀 방지)
CREATE POLICY "family_members_select_policy" ON family_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "family_members_insert_policy" ON family_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM families 
      WHERE id = family_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "family_members_delete_policy" ON family_members
  FOR DELETE USING (user_id = auth.uid());

-- 7. ledger_entries 테이블 정책
CREATE POLICY "ledger_entries_select_policy" ON ledger_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ledger_entries_insert_policy" ON ledger_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ledger_entries_update_policy" ON ledger_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ledger_entries_delete_policy" ON ledger_entries
  FOR DELETE USING (user_id = auth.uid());

-- 8. ledger_categories 테이블 정책
CREATE POLICY "categories_select_policy" ON ledger_categories
  FOR SELECT USING (auth.role() = 'authenticated');