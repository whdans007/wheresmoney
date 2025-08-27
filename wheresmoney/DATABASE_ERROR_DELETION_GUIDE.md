# "Database error deleting user" 해결 가이드

## 문제 상황
Supabase 대시보드에서 사용자 삭제 시 "Database error deleting user" 오류가 발생하는 경우

## 원인
사용자와 연결된 다른 테이블의 데이터들(가족, 가계부 기록 등)이 있어서 외래키 제약조건으로 인해 삭제가 차단됨

## 해결 방법

### 방법 1: 단계별 수동 삭제 (추천)

**1단계: 사용자 정보 확인**
```sql
-- 삭제할 사용자 정보 확인
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = '삭제할이메일@example.com';
```

**2단계: 관련 데이터 확인**
```sql
-- 해당 사용자의 관련 데이터 확인
DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := '삭제할이메일@example.com'; -- 실제 이메일로 변경
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;
  
  RAISE NOTICE 'User ID: %', target_user_id;
  
  -- 관련 데이터 개수 확인
  RAISE NOTICE 'Ledger entries: %', (SELECT COUNT(*) FROM public.ledger_entries WHERE user_id = target_user_id);
  RAISE NOTICE 'Family memberships: %', (SELECT COUNT(*) FROM public.family_members WHERE user_id = target_user_id);
  RAISE NOTICE 'Owned families: %', (SELECT COUNT(*) FROM public.families WHERE owner_id = target_user_id);
  RAISE NOTICE 'Public profile exists: %', (SELECT COUNT(*) FROM public.users WHERE id = target_user_id);
END $$;
```

**3단계: supabase-manual-user-deletion.sql 파일 사용**
1. `supabase-manual-user-deletion.sql` 파일 열기
2. 파일 내의 `target_email` 변수를 실제 삭제할 이메일로 변경
3. Supabase SQL Editor에서 전체 스크립트 실행

### 방법 2: 개별 단계별 삭제

**순서대로 실행하세요:**

```sql
-- 1. 사용자 ID 확인
SELECT id FROM auth.users WHERE email = '삭제할이메일@example.com';
-- 결과로 나온 ID를 아래 쿼리들에서 사용

-- 2. 가계부 기록 삭제
DELETE FROM public.ledger_entries WHERE user_id = '여기에_사용자_ID';

-- 3. 가족 멤버십 삭제  
DELETE FROM public.family_members WHERE user_id = '여기에_사용자_ID';

-- 4. 소유한 빈 가족 삭제 (다른 멤버가 없는 경우)
DELETE FROM public.families 
WHERE owner_id = '여기에_사용자_ID'
AND id NOT IN (
  SELECT DISTINCT family_id 
  FROM public.family_members 
  WHERE user_id != '여기에_사용자_ID'
);

-- 5. 사용자 프로필 삭제
DELETE FROM public.users WHERE id = '여기에_사용자_ID';

-- 6. 마지막으로 Auth 사용자 삭제
DELETE FROM auth.users WHERE id = '여기에_사용자_ID';
```

### 방법 3: 외래키 제약조건 확인

**어떤 테이블이 문제인지 확인:**
```sql
-- 현재 외래키 제약조건 확인
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'users' OR ccu.table_name = 'auth.users');
```

## 삭제 후 확인

**모든 관련 데이터가 삭제되었는지 확인:**
```sql
-- Auth 테이블 확인
SELECT COUNT(*) FROM auth.users WHERE email = '삭제한이메일@example.com';

-- Public 테이블 확인  
SELECT COUNT(*) FROM public.users WHERE email = '삭제한이메일@example.com';

-- 둘 다 0이어야 함
```

## 예방책

### RLS 정책 수정으로 CASCADE 삭제 활성화
```sql
-- 자동 CASCADE 삭제를 위한 외래키 제약조건 수정
-- (주의: 기존 데이터가 있는 경우 신중하게 진행)

-- 예시: ledger_entries 테이블
ALTER TABLE public.ledger_entries 
DROP CONSTRAINT IF EXISTS ledger_entries_user_id_fkey;

ALTER TABLE public.ledger_entries 
ADD CONSTRAINT ledger_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## 문제가 지속되는 경우

### 1. 숨겨진 참조 확인
```sql
-- 모든 테이블에서 해당 사용자 ID 검색
DO $$
DECLARE
  rec RECORD;
  target_user_id UUID := '사용자_ID_여기에';
BEGIN
  FOR rec IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format('
      SELECT ''%I'' as table_name, count(*) as count 
      FROM %I 
      WHERE user_id = $1', rec.table_name, rec.table_name) 
    USING target_user_id;
  END LOOP;
END $$;
```

### 2. 강제 삭제 (최후의 수단)
```sql
-- 외래키 제약조건 임시 비활성화 후 삭제
SET session_replication_role = replica;
DELETE FROM auth.users WHERE email = '삭제할이메일@example.com';
SET session_replication_role = DEFAULT;
```

⚠️ **주의사항:**
- 프로덕션 데이터베이스에서는 반드시 백업 후 진행
- 강제 삭제는 데이터 무결성을 깨뜨릴 수 있음
- 테스트 환경에서 충분히 검증 후 사용

이 가이드를 따라하면 "Database error deleting user" 오류를 해결하고 사용자를 완전히 삭제할 수 있습니다.