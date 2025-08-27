#!/bin/bash

# Supabase Edge Function 배포 스크립트
# delete-account 함수를 Supabase에 배포합니다

echo "🚀 Edge Function 배포 시작..."

# Supabase CLI 설치 확인
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI가 설치되지 않았습니다."
    echo "설치 방법: brew install supabase/tap/supabase"
    exit 1
fi

# 프로젝트 ID 확인
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "⚠️  SUPABASE_PROJECT_ID 환경변수가 설정되지 않았습니다."
    echo "Supabase Dashboard > Settings > General에서 Project ID를 확인하세요."
    echo ""
    echo "사용법:"
    echo "export SUPABASE_PROJECT_ID=your-project-id"
    echo "./deploy-edge-function.sh"
    exit 1
fi

# Edge Function 배포
echo "📦 delete-account 함수 배포 중..."
supabase functions deploy delete-account --project-ref $SUPABASE_PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Edge Function이 성공적으로 배포되었습니다!"
    echo ""
    echo "테스트 방법:"
    echo "1. 앱에서 로그인"
    echo "2. 프로필 > 회원 탈퇴"
    echo "3. 확인 후 삭제 진행"
    echo ""
    echo "함수 URL: https://$SUPABASE_PROJECT_ID.supabase.co/functions/v1/delete-account"
else
    echo "❌ 배포 실패. 위의 오류를 확인하세요."
    exit 1
fi