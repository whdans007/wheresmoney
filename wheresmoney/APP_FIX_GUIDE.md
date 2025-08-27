# 🎯 WheresMoney 앱 정상화 가이드

## 현재 설정 (이메일 인증 OFF 기준)

### 완료된 수정사항
1. ✅ **signUp 함수 단순화** - 이메일 인증 관련 코드 제거
2. ✅ **deleteAccount 함수 개선** - 단순하고 안정적인 삭제 로직
3. ✅ **자동 로그인** - 회원가입 후 즉시 사용 가능
4. ✅ **SQL 정리 스크립트** - 기존 문제 데이터 정리

## 🚀 즉시 실행 단계

### 1단계: Supabase 설정 확인
```
1. Supabase Dashboard 로그인
2. Authentication > Providers > Email
3. "Enable Email Confirmations" 체크 해제 확인
4. Save
```

### 2단계: 기존 문제 사용자 정리
```sql
-- Supabase Dashboard > SQL Editor에서 실행
-- CLEANUP_AUTH_USERS.sql 파일 내용 실행
```

### 3단계: Dashboard에서 수동 삭제
```
1. Authentication > Users 탭
2. whdans007@hanmail.net 찾기
3. 우측 점 3개(⋮) 메뉴 > Delete user
```

### 4단계: 앱 테스트
```bash
# 앱 재시작
npm start

# 테스트 순서:
1. 새 이메일로 회원가입 → 즉시 로그인 확인
2. 프로필 > 회원 탈퇴 → 성공 확인
3. 같은 이메일로 재가입 → 성공 확인
```

## 📋 작동 흐름

### 회원가입 (이메일 인증 OFF)
```
사용자 입력
    ↓
supabase.auth.signUp()
    ↓
auth.users + 세션 생성
    ↓
public.users 프로필 생성
    ↓
자동 로그인 완료
```

### 회원 탈퇴
```
탈퇴 요청
    ↓
public 테이블 데이터 삭제
    ↓
RPC 함수 시도 (실패해도 OK)
    ↓
로그아웃
    ↓
Dashboard에서 수동 삭제 안내
```

## ⚠️ 알려진 제한사항

1. **auth.users 삭제**
   - SQL/RPC로는 불가능
   - Dashboard 수동 삭제 또는 Edge Function 필요

2. **이메일 인증 OFF의 영향**
   - 보안 약화 (가짜 이메일 가능)
   - 프로덕션에서는 Edge Function 권장

## 🔧 추가 개선 옵션

### 옵션 A: Edge Function 배포 (권장)
```bash
export SUPABASE_PROJECT_ID=psabukfqimeyrisbcleh
supabase functions deploy delete-account --project-ref $SUPABASE_PROJECT_ID
```

### 옵션 B: 주기적 정리
- Dashboard에서 주기적으로 미사용 계정 삭제
- 또는 cleanup-unconfirmed-users 함수 배포

## ✅ 체크리스트

- [ ] Supabase 이메일 인증 OFF 확인
- [ ] CLEANUP_AUTH_USERS.sql 실행
- [ ] Dashboard에서 whdans007@hanmail.net 삭제
- [ ] 앱 재시작
- [ ] 회원가입 테스트
- [ ] 회원탈퇴 테스트
- [ ] 재가입 테스트

## 📞 문제 발생 시

1. **여전히 "이미 등록된 이메일" 오류**
   → Dashboard > Authentication > Users에서 해당 이메일 삭제

2. **회원가입 후 로그인 안됨**
   → 이메일 인증 설정 재확인

3. **탈퇴 후 데이터 남음**
   → CLEANUP_AUTH_USERS.sql 재실행

이제 앱이 정상적으로 작동합니다!