-- 빠른 이메일 상태 확인 (간단 버전)
-- whdans007@hanmail.net 상태를 빠르게 확인

SELECT 
  '=== whdans007@hanmail.net 상태 확인 ===' as status_check;

-- 1. auth.users 테이블 확인
SELECT 
  'AUTH 테이블' as table_name,
  COUNT(*) as count,
  MAX(CASE WHEN email_confirmed_at IS NULL THEN '미인증' ELSE '인증완료' END) as status,
  MAX(created_at) as latest_created
FROM auth.users 
WHERE email = 'whdans007@hanmail.net';

-- 2. public.users 테이블 확인  
SELECT 
  'PUBLIC 테이블' as table_name,
  COUNT(*) as count,
  MAX(nickname) as nickname,
  MAX(created_at) as latest_created
FROM public.users 
WHERE email = 'whdans007@hanmail.net';

-- 3. 최근 10분간 생성된 모든 사용자 (참고용)
SELECT 
  'RECENT USERS (10분)' as info,
  COUNT(*) as total_recent_signups
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '10 minutes';

-- 4. 상세 정보 (auth.users에 데이터가 있는 경우)
SELECT 
  'DETAILED INFO' as section,
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ 미인증'
    ELSE '✅ 인증완료: ' || email_confirmed_at::text
  END as email_status,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'whdans007@hanmail.net'
LIMIT 1;

-- 5. 결론
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'whdans007@hanmail.net') 
    THEN '✅ 회원가입 성공 - Auth 테이블에 존재'
    ELSE '❌ 회원가입 실패 - Auth 테이블에 없음'
  END as auth_result,
  
  CASE 
    WHEN EXISTS(SELECT 1 FROM public.users WHERE email = 'whdans007@hanmail.net') 
    THEN '✅ 프로필 생성 완료 - Public 테이블에 존재'
    ELSE '❌ 프로필 미생성 - Public 테이블에 없음 (이메일 미인증일 가능성)'
  END as profile_result;