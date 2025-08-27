# 회원 탈퇴 기능 수정 완료 - 설정 지침

## 🎯 수정 완료된 항목

1. **새로운 관리자 권한 RPC 함수 생성** (`supabase-admin-delete-user.sql`)
2. **auth.ts의 deleteAccount() 함수 완전 개선**
3. **더 간단하고 안전한 삭제 로직**

## 🚀 Supabase에서 실행해야 할 SQL (순서대로)

### 1단계: 기존 문제 사용자 강제 삭제
```bash
# Supabase 대시보드 > SQL Editor에서 실행:
FORCE_DELETE_USER.sql
```

### 2단계: 새로운 Admin 삭제 함수 설치
```bash
# Supabase 대시보드 > SQL Editor에서 실행:
supabase-admin-delete-user.sql
```

## ✅ 수정된 deleteAccount() 로직

기존의 복잡한 단계별 삭제 로직을 **단일 RPC 함수 호출**로 교체:

```typescript
static async deleteAccount() {
  // 1. 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Admin 권한 RPC로 완전 삭제
  const { data: deleteResult, error: rpcError } = 
    await supabase.rpc('delete_current_user');
  
  // 3. 결과 검증 및 로컬 상태 정리
  if (deleteResult.success) {
    useAuthStore.getState().setUser(null);
    return { success: true, message: '계정 삭제 완료' };
  }
}
```

## 🔧 새로운 RPC 함수의 장점

1. **SECURITY DEFINER** - 관리자 권한으로 실행
2. **완전한 외래 키 처리** - 모든 관련 데이터 자동 정리
3. **트랜잭션 안전성** - 실패 시 롤백
4. **상세한 삭제 로그** - JSON 형태로 결과 반환

## 🧪 테스트 계획

1. **SQL 설치 후 앱 재시작**
2. **whdans007@hanmail.net으로 로그인 시도** - 실패해야 함
3. **새 계정으로 회원가입 → 탈퇴 → 재가입 테스트**
4. **삭제 후 Supabase Users 테이블에서 완전히 사라지는지 확인**

## 🎯 예상 결과

- ✅ 회원 탈퇴 시 모든 데이터 완전 삭제 (auth + public 테이블)
- ✅ 탈퇴 후 로그인 불가능
- ✅ 같은 이메일로 재가입 가능
- ✅ 가족 소유권 적절히 이전 또는 빈 가족 삭제

이제 SQL 스크립트 두 개만 실행하면 회원 탈퇴 기능이 완벽하게 작동할 것입니다!