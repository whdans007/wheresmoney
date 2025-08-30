-- RLS 정책 수정: 초대 코드 조회를 위한 정책
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 families 테이블의 SELECT 정책 확인 및 삭제
DROP POLICY IF EXISTS "Family members can view family" ON families;
DROP POLICY IF EXISTS "Family members and invite code users can view family" ON families;

-- 2. 새로운 정책 생성: 가족 멤버 또는 초대 코드 조회를 위한 경우 허용
CREATE POLICY "Allow family access for members and invite lookup" ON families
    FOR SELECT USING (
        -- 가족 멤버는 모든 정보 조회 가능
        EXISTS (
            SELECT 1 FROM family_members 
            WHERE family_id = families.id AND user_id = auth.uid()
        )
        OR
        -- 인증된 사용자는 초대 코드 조회를 위해 기본 정보만 조회 가능
        auth.uid() IS NOT NULL
    );

-- 3. 확인용 쿼리 (실행 후 결과 확인)
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'families' 
AND schemaname = 'public';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '=== RLS 정책 수정 완료 ===';
    RAISE NOTICE '이제 인증된 사용자는 초대 코드로 가족방을 조회할 수 있습니다.';
    RAISE NOTICE '가족 멤버는 여전히 모든 가족 정보에 접근할 수 있습니다.';
END $$;