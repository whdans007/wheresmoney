# 🚀 프로덕션 레벨 회원 탈퇴 시스템 설정 가이드

## 📋 개요
Supabase Edge Functions를 사용한 완전한 사용자 삭제 시스템입니다.
auth.users 테이블을 포함한 모든 데이터를 안전하게 삭제할 수 있습니다.

## 🔧 시스템 구성

### 1. Edge Functions
- **delete-account**: 사용자 계정 완전 삭제
- **cleanup-unconfirmed-users**: 미인증 사용자 자동 정리

### 2. 주요 기능
- ✅ auth.users 테이블 완전 삭제 (Service Role Key 사용)
- ✅ 가족 소유권 자동 이전 또는 삭제
- ✅ Storage 파일 정리
- ✅ 24시간 이상 미인증 사용자 자동 삭제
- ✅ 삭제 후 같은 이메일로 즉시 재가입 가능

## 📦 설치 및 배포

### 1단계: Supabase CLI 설치
```bash
# macOS
brew install supabase/tap/supabase

# npm
npm install -g supabase

# 설치 확인
supabase --version
```

### 2단계: 프로젝트 연결
```bash
# Supabase Dashboard에서 Project ID 확인
# Settings > General > Reference ID

# 환경변수 설정
export SUPABASE_PROJECT_ID=your-project-id

# 로그인
supabase login
```

### 3단계: Edge Functions 배포
```bash
# wheresmoney/wheresmoney 디렉토리에서 실행
cd /Users/minjongmun/wheresmoney/wheresmoney

# delete-account 함수 배포
supabase functions deploy delete-account \
  --project-ref $SUPABASE_PROJECT_ID

# cleanup-unconfirmed-users 함수 배포
supabase functions deploy cleanup-unconfirmed-users \
  --project-ref $SUPABASE_PROJECT_ID
```

### 4단계: Cron Job 설정 (자동 정리)
Supabase Dashboard에서:
1. **Database** → **Extensions**
2. `pg_cron` 활성화
3. **SQL Editor**에서 실행:

```sql
-- 매일 새벽 3시에 미인증 사용자 정리 실행
SELECT cron.schedule(
  'cleanup-unconfirmed-users',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/cleanup-unconfirmed-users',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

## 🧪 테스트

### 1. 기존 문제 사용자 정리
```bash
# Supabase Dashboard > Authentication > Users
# whdans007@hanmail.net 수동 삭제
```

### 2. 회원 탈퇴 테스트
```javascript
// 앱에서 로그인 후 실행
await AuthService.deleteAccount();
// 콘솔에서 "✅ 회원 탈퇴 완료" 확인
```

### 3. 재가입 테스트
```javascript
// 같은 이메일로 바로 재가입 시도
await AuthService.signUp('whdans007@hanmail.net', 'password', 'nickname');
// 인증 메일이 정상적으로 발송되는지 확인
```

### 4. 자동 정리 테스트
```bash
# 수동으로 cleanup 함수 실행
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/cleanup-unconfirmed-users \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 🔒 보안 고려사항

### 1. Service Role Key 보안
- **절대 클라이언트 코드에 노출하지 마세요**
- Edge Functions 내부에서만 사용
- 환경변수로 안전하게 관리

### 2. 권한 검증
- 사용자는 자신의 계정만 삭제 가능
- JWT 토큰으로 인증 확인
- Edge Function이 권한 검증 담당

### 3. 데이터 백업
- 삭제 전 중요 데이터 export 기능 고려
- 삭제 로그 저장 (감사 목적)

## 📊 모니터링

### Edge Functions 로그 확인
```bash
# delete-account 함수 로그
supabase functions logs delete-account \
  --project-ref $SUPABASE_PROJECT_ID

# cleanup 함수 로그
supabase functions logs cleanup-unconfirmed-users \
  --project-ref $SUPABASE_PROJECT_ID
```

### Dashboard 모니터링
- Supabase Dashboard > Functions
- 실행 횟수, 에러율, 응답 시간 확인

## ⚠️ 주의사항

1. **Edge Functions 배포 필수**
   - SQL RPC 방식은 auth.users 삭제 불가
   - 반드시 Edge Functions 사용

2. **환경변수 설정**
   - `EXPO_PUBLIC_SUPABASE_URL` 확인
   - Edge Function URL이 올바른지 확인

3. **이메일 설정**
   - SMTP 설정이 올바른지 확인
   - 인증 메일 템플릿 커스터마이징 가능

## 🎯 문제 해결 완료

### 해결된 문제들:
- ✅ 회원 탈퇴 후 auth.users에 데이터 잔존 → Edge Function으로 완전 삭제
- ✅ 탈퇴 후 재가입 시 인증메일 안옴 → auth.users 완전 삭제로 해결
- ✅ 탈퇴 후에도 로그인 가능 → auth.users 삭제로 즉시 차단
- ✅ 미인증 사용자 누적 → 자동 정리 시스템으로 해결

### 최종 아키텍처:
```
사용자 탈퇴 요청
    ↓
auth.ts (클라이언트)
    ↓
Edge Function (서버)
    ↓
Service Role Key로 auth.admin.deleteUser()
    ↓
완전 삭제 성공
```

이제 프로덕션 환경에서 안전하고 완전한 사용자 삭제가 가능합니다!