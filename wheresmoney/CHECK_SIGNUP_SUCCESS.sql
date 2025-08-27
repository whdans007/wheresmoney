-- 회원가입 성공 후 실제 데이터 상태 확인
-- 이메일 확인이 필요한 경우 미인증 상태로 auth.users에 저장됨

DO $$
DECLARE
  target_email TEXT := 'whdans007@hanmail.net';
BEGIN
  RAISE NOTICE '=== % 회원가입 후 상태 확인 ===', target_email;
  
  -- 1. auth.users에서 모든 상태 확인 (미인증 포함)
  DECLARE
    auth_user RECORD;
    total_auth_users INTEGER;
  BEGIN
    -- 전체 auth 사용자 수
    SELECT COUNT(*) INTO total_auth_users FROM auth.users;
    RAISE NOTICE '전체 auth.users: % 명', total_auth_users;
    
    -- 해당 이메일 사용자 확인
    SELECT 
      id, 
      email, 
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data
    INTO auth_user
    FROM auth.users 
    WHERE email = target_email;
    
    IF FOUND THEN
      RAISE NOTICE '✅ auth.users에서 발견!';
      RAISE NOTICE '   ID: %', auth_user.id;
      RAISE NOTICE '   Email: %', auth_user.email;
      RAISE NOTICE '   이메일 인증: %', 
        CASE 
          WHEN auth_user.email_confirmed_at IS NULL THEN '미인증 상태' 
          ELSE '인증 완료 (' || auth_user.email_confirmed_at || ')'
        END;
      RAISE NOTICE '   생성일: %', auth_user.created_at;
      RAISE NOTICE '   메타데이터: %', auth_user.raw_user_meta_data;
    ELSE
      RAISE NOTICE '❌ auth.users에서 찾지 못함';
    END IF;
  END;
  
  -- 2. public.users 확인
  DECLARE
    public_user RECORD;
  BEGIN
    SELECT id, email, nickname, created_at
    INTO public_user
    FROM public.users 
    WHERE email = target_email;
    
    IF FOUND THEN
      RAISE NOTICE '✅ public.users에서 발견!';
      RAISE NOTICE '   ID: %', public_user.id;
      RAISE NOTICE '   Nickname: %', public_user.nickname;
      RAISE NOTICE '   생성일: %', public_user.created_at;
    ELSE
      RAISE NOTICE '❌ public.users에서 찾지 못함 (트리거가 실행되지 않았거나 이메일 미인증)';
    END IF;
  END;
  
  -- 3. 최근 생성된 사용자들 확인 (다른 이메일 포함)
  DECLARE
    recent_user RECORD;
  BEGIN
    RAISE NOTICE '=== 최근 생성된 auth.users (최근 10분) ===';
    FOR recent_user IN
      SELECT email, email_confirmed_at, created_at
      FROM auth.users 
      WHERE created_at >= NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 5
    LOOP
      RAISE NOTICE '- %: % (생성: %)', 
        recent_user.email,
        CASE WHEN recent_user.email_confirmed_at IS NULL THEN '미인증' ELSE '인증됨' END,
        recent_user.created_at;
    END LOOP;
  END;
  
  -- 4. 이메일 확인 설정 상태 추정
  DECLARE
    unconfirmed_count INTEGER;
    confirmed_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO unconfirmed_count FROM auth.users WHERE email_confirmed_at IS NULL;
    SELECT COUNT(*) INTO confirmed_count FROM auth.users WHERE email_confirmed_at IS NOT NULL;
    
    RAISE NOTICE '=== Supabase 설정 추정 ===';
    RAISE NOTICE '미인증 사용자: % 명', unconfirmed_count;
    RAISE NOTICE '인증 사용자: % 명', confirmed_count;
    
    IF unconfirmed_count > 0 THEN
      RAISE NOTICE '💡 이메일 확인이 활성화되어 있는 것으로 보임';
      RAISE NOTICE '   사용자는 이메일 인증 후에 public.users에 생성됨';
    ELSE
      RAISE NOTICE '💡 이메일 확인이 비활성화되어 있거나 모든 사용자가 인증 완료';
    END IF;
  END;
  
  -- 5. 권장 사항
  RAISE NOTICE '=== 권장 사항 ===';
  RAISE NOTICE '1. Supabase 대시보드 > Authentication > Users 확인';
  RAISE NOTICE '2. Authentication > Settings > Email 탭에서 "Enable email confirmations" 확인';
  RAISE NOTICE '3. 이메일함(스팸폴더 포함)에서 인증 이메일 확인';
  RAISE NOTICE '4. 인증 이메일이 없다면 SMTP 설정 확인';
  
END $$;