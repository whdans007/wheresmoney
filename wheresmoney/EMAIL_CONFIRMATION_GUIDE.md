# 이메일 인증 문제 해결 가이드

## 현재 상황
회원 탈퇴 후 재가입 시 인증 메일이 오지 않는 문제가 발생하고 있습니다.

## 가능한 원인들

### 1. Supabase 이메일 확인 설정이 비활성화됨
**확인 방법:**
- Supabase 대시보드 > Authentication > Settings > Email 탭
- "Enable email confirmations" 체크박스가 활성화되어 있는지 확인

**해결책:**
- "Enable email confirmations" 체크
- "Secure email change" 체크 (권장)

### 2. 이메일 템플릿 문제
**확인 방법:**
- Authentication > Email Templates에서 템플릿 확인
- "Confirm signup" 템플릿이 올바르게 설정되어 있는지 확인

### 3. SMTP 설정 문제
**확인 방법:**
- Authentication > Settings > SMTP 설정 확인
- 커스텀 SMTP를 사용하는 경우 설정이 올바른지 확인

**해결책:**
- 기본 Supabase SMTP 사용하거나
- 신뢰할 수 있는 SMTP 서비스 설정 (SendGrid, Mailgun 등)

## 구현된 해결책들

### 1. 향상된 디버깅 로그
```typescript
// 회원가입 시 자세한 로그 출력
console.log('SignUp result:', { data, error });
console.log('SignUp 성공:', {
  userId: data.user.id,
  email: data.user.email,
  emailConfirmed: data.user.email_confirmed_at,
  hasSession: !!data.session
});
```

### 2. 강화된 재발송 로직
- `resendConfirmationEmail()`: 기본 재발송
- `forceResendEmail()`: 대안 방법으로 재발송 시도

### 3. 사용자 친화적인 오류 처리
- Rate limit 에러 감지 및 안내
- 존재하지 않는 계정 감지
- 강제 재발송 옵션 제공

### 4. 미인증 사용자 정리 시스템
- 24시간 이상 지난 미인증 사용자 자동 정리
- 관리자용 정리 함수들 제공

## 테스트 방법

### 1. 회원가입 테스트
```javascript
// 콘솔에서 다음 로그들을 확인:
// - "회원가입 시도: email@example.com"
// - "SignUp result: { data, error }"
// - "이메일 인증 필요" 또는 "즉시 로그인 완료"
```

### 2. 재발송 테스트
```javascript
// 로그인 화면에서 미인증 사용자로 로그인 시도
// "이메일 재발송" 버튼 클릭
// 콘솔에서 재발송 로그 확인
```

## 수동 확인 방법

### 1. Supabase 대시보드에서 사용자 확인
- Authentication > Users 탭
- 해당 이메일의 "Email Confirmed" 컬럼 확인
- 미인증 사용자는 "-"로 표시됨

### 2. SQL 쿼리로 직접 확인
```sql
-- 미인증 사용자들 조회
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
```

## 권장 해결 순서

1. **Supabase 설정 확인**
   - Authentication > Settings > Email > "Enable email confirmations" 활성화

2. **이메일 템플릿 확인**
   - Authentication > Email Templates > "Confirm signup" 템플릿 확인

3. **SMTP 설정 확인**
   - 기본 설정 사용하거나 올바른 SMTP 설정

4. **테스트 실행**
   - 새 이메일로 회원가입 테스트
   - 콘솔 로그 확인

5. **미인증 사용자 정리**
   - `supabase-cleanup-unconfirmed-users.sql` 실행

## 추가 디버깅 정보

앱에서 회원가입 시 다음 정보들을 콘솔에서 확인할 수 있습니다:
- 회원가입 시도 로그
- SignUp API 응답 상세 정보
- 이메일 인증 필요 여부
- 세션 생성 여부
- 재발송 시도 결과

문제가 지속되면 Supabase 대시보드의 Authentication 설정을 다시 한 번 확인해주세요.