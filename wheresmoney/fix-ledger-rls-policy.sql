-- RLS 정책 수정: 가족 구성원이 가계부 항목을 볼 수 있도록 수정

-- 기존 잘못된 정책 삭제
DROP POLICY IF EXISTS "ledger_entries_select_policy" ON ledger_entries;
DROP POLICY IF EXISTS "ledger_entries_insert_policy" ON ledger_entries;
DROP POLICY IF EXISTS "ledger_entries_update_policy" ON ledger_entries;
DROP POLICY IF EXISTS "ledger_entries_delete_policy" ON ledger_entries;

-- 올바른 정책들 생성
-- 1. 조회: 같은 가족 구성원들이 볼 수 있음
CREATE POLICY "Family members can view ledger entries" ON ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE family_id = ledger_entries.family_id AND user_id = auth.uid()
    )
  );

-- 2. 삽입: 자신이 속한 가족방에만 추가 가능
CREATE POLICY "Family members can insert ledger entries" ON ledger_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE family_id = ledger_entries.family_id AND user_id = auth.uid()
    )
  );

-- 3. 수정: 작성자 또는 가족방 소유자만 수정 가능
CREATE POLICY "Users can update own ledger entries" ON ledger_entries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM families 
      WHERE id = ledger_entries.family_id AND owner_id = auth.uid()
    )
  );

-- 4. 삭제: 작성자 또는 가족방 소유자만 삭제 가능
CREATE POLICY "Users can delete own ledger entries" ON ledger_entries
  FOR DELETE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM families 
      WHERE id = ledger_entries.family_id AND owner_id = auth.uid()
    )
  );