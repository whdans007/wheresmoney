-- 현재 Authentication에 남아있는 사용자 확인 및 정리
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. 현재 상태 확인
SELECT 
  '=== AUTH USERS 상태 확인 ===' as status;

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ 미인증'
    ELSE '✅ 인증됨'
  END as status
FROM auth.users
WHERE email = 'whdans007@hanmail.net'
   OR email LIKE '%test%'
ORDER BY created_at DESC;

-- 2. Public users와 비교
SELECT 
  '=== PUBLIC vs AUTH 비교 ===' as comparison;

SELECT 
  a.email,
  a.id as auth_id,
  p.id as public_id,
  CASE 
    WHEN p.id IS NULL THEN '⚠️ Public 없음 (삭제 필요)'
    ELSE '✅ 양쪽 존재'
  END as status
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE a.email = 'whdans007@hanmail.net'
   OR a.email LIKE '%test%';

-- 3. Public 데이터만 있는 사용자 정리
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 4. 관련 데이터 정리 (auth.users에 없는 데이터)
DELETE FROM public.ledger_entries 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.family_members 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. 빈 가족 정리
DELETE FROM public.families 
WHERE id NOT IN (SELECT DISTINCT family_id FROM public.family_members);

-- ⚠️ 중요: auth.users 삭제는 Dashboard에서만 가능
-- Supabase Dashboard > Authentication > Users에서:
-- 1. whdans007@hanmail.net 찾기
-- 2. 우측 점 3개 메뉴 클릭
-- 3. Delete user 선택

SELECT 
  '=== 정리 완료 ===' as result,
  '⚠️ auth.users 삭제는 Dashboard에서 수동으로 진행하세요' as note;

-- 정리 후 상태 확인
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email = 'whdans007@hanmail.net') as auth_count,
  (SELECT COUNT(*) FROM public.users WHERE email = 'whdans007@hanmail.net') as public_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users WHERE email = 'whdans007@hanmail.net') = 0 
    THEN '✅ 재가입 가능'
    ELSE '❌ Dashboard에서 삭제 필요'
  END as status;