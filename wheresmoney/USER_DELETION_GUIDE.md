# 기존 가입자 완전 삭제 가이드

## 문제 상황
회원 탈퇴 후에도 Supabase Auth에 사용자 정보가 남아있어서 같은 이메일로 재가입할 수 없는 상황

## 해결 방법

### 방법 1: Supabase 대시보드에서 직접 삭제 (가장 쉬운 방법)

**1단계: 사용자 확인**
1. Supabase 대시보드 → **Authentication** → **Users**
2. 문제가 되는 이메일 주소 검색
3. 해당 사용자의 "Email Confirmed" 상태 확인

**2단계: 사용자 직접 삭제**
1. 사용자 행의 **오른쪽 끝 "..." 메뉴** 클릭
2. **"Delete user"** 선택
3. 확인 대화상자에서 **"Delete"** 클릭

**3단계: 정리 확인**
1. **Database** → **Table Editor** → **users** 테이블에서 해당 사용자 확인
2. 남아있다면 수동으로 삭제

### 방법 2: SQL 쿼리로 완전 삭제

**1단계: SQL Editor 열기**
- Supabase 대시보드 → **SQL Editor** → **New Query**

**2단계: 사용자 정보 확인**
```sql
-- 특정 이메일 사용자 정보 확인
SELECT admin_find_user_by_email('문제되는이메일@example.com');
```

**3단계: 완전 삭제 실행**
```sql
-- 특정 이메일 사용자 완전 삭제
SELECT admin_delete_user_by_email('문제되는이메일@example.com');
```

**4단계: 미인증 사용자 일괄 정리**
```sql
-- 모든 미인증 사용자 삭제 (1시간 이상 지난)
SELECT admin_delete_unconfirmed_users();
```

### 방법 3: 수동 SQL 삭제 (위 함수가 작동하지 않는 경우)

```sql
-- 1. 사용자 ID 확인
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = '문제되는이메일@example.com';

-- 2. 해당 사용자 ID로 모든 관련 데이터 삭제
DO $$
DECLARE
  user_id_to_delete UUID := 'USER_ID_HERE'; -- 위에서 확인한 ID 입력
BEGIN
  -- 관련 데이터 삭제
  DELETE FROM public.ledger_entries WHERE user_id = user_id_to_delete;
  DELETE FROM public.family_members WHERE user_id = user_id_to_delete;
  DELETE FROM public.users WHERE id = user_id_to_delete;
  
  -- Auth 사용자 삭제 (가장 중요!)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RAISE NOTICE 'User deleted successfully';
END $$;
```

## 삭제 후 확인사항

### 1. Auth 테이블 확인
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = '삭제한이메일@example.com';
-- 결과가 없어야 함
```

### 2. Public 테이블 확인
```sql
SELECT id, email 
FROM public.users 
WHERE email = '삭제한이메일@example.com';
-- 결과가 없어야 함
```

### 3. 재가입 테스트
1. 앱에서 해당 이메일로 새 회원가입 시도
2. "이미 등록된 이메일" 오류가 나오지 않아야 함
3. 정상적으로 인증 이메일이 발송되어야 함

## 예방책

### 1. 회원 탈퇴 함수 개선
현재 `AuthService.deleteAccount()` 함수는 완전 삭제를 시도하지만, 권한 문제로 실패할 수 있습니다.

### 2. 정기적인 정리
```sql
-- 매일 실행할 정리 쿼리
SELECT admin_delete_unconfirmed_users();
```

### 3. 모니터링 쿼리
```sql
-- 미인증 사용자 현황 확인
SELECT 
  COUNT(*) as total_unconfirmed,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '24 hours' THEN 1 END) as old_unconfirmed
FROM auth.users 
WHERE email_confirmed_at IS NULL;
```

## 주의사항

⚠️ **중요**: 
- 삭제된 데이터는 복구할 수 없습니다
- 프로덕션에서는 반드시 백업 후 진행하세요
- 테스트 환경에서 충분히 검증 후 사용하세요

## 문제가 지속되는 경우

1. **Supabase 설정 재확인**:
   - Authentication → Settings → Email → "Enable email confirmations" 체크
   
2. **이메일 서비스 확인**:
   - SMTP 설정이 올바른지 확인
   - 스팸폴더 확인
   
3. **캐시 문제**:
   - 브라우저 캐시/쿠키 삭제
   - 앱 재시작

이 가이드를 따라하면 기존 가입자 정보를 완전히 삭제하고 재가입이 가능해집니다.