-- 임시로 RLS 비활성화 (테스트용)
-- 나중에 서비스 레벨에서 보안 처리

-- 가족방 관련 테이블들의 RLS 임시 비활성화
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_categories DISABLE ROW LEVEL SECURITY;

-- 참고: 운영 환경에서는 RLS를 반드시 활성화해야 함
-- 현재는 무한 재귀 문제 해결을 위한 임시 조치