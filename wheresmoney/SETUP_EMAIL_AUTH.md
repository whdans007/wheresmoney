# 이메일 인증 설정 가이드

## 1. Supabase 이메일 템플릿 커스터마이징

### Authentication → Templates → Confirm signup

**Subject:**
```
wheresmoney 계정 인증을 완료해주세요
```

**Body (HTML):**
```html
<h2>안녕하세요!</h2>
<p>wheresmoney 가족 가계부 앱에 가입해주셔서 감사합니다.</p>
<p>아래 버튼을 클릭하여 계정을 인증해주세요:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #6200EE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">계정 인증하기</a></p>
<p>만약 버튼이 작동하지 않는다면, 다음 링크를 브라우저에 복사하여 붙여넣으세요:</p>
<p>{{ .ConfirmationURL }}</p>
<p>이 링크는 24시간 동안 유효합니다.</p>
<br>
<p>감사합니다,<br>wheresmoney 팀</p>
```

## 2. Authentication 설정 확인

### Authentication → Settings

- ✅ Enable email confirmations
- ✅ Enable custom SMTP (선택사항 - 자체 이메일 서버 사용시)
- Site URL: 앱의 기본 URL 설정

## 3. 테스트 플로우

1. 새 계정으로 회원가입
2. 이메일 확인 (wheresmoney 브랜딩으로 수신)
3. 이메일의 "계정 인증하기" 버튼 클릭
4. 브라우저에서 인증 완료 후 자동으로 앱 로그인 상태로 전환

## 4. 문제 해결

- 이메일이 오지 않는 경우: 스팸함 확인
- 인증 후 로그인되지 않는 경우: 앱 재시작 또는 수동 로그인
- 개발 중에는 Supabase Dashboard의 Authentication → Users에서 수동으로 이메일 확인 처리 가능