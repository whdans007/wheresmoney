# 📱 가계부 기록 기능 완성 가이드

## ✅ 구현 완료된 기능

### 1. **LedgerService** - 가계부 관리 서비스
- ✅ 이미지 업로드 (Supabase Storage)
- ✅ 가계부 항목 생성, 조회, 수정, 삭제
- ✅ 월별 통계 기능
- ✅ 타입 안전성 보장

### 2. **AddLedgerEntryScreen** - 가계부 작성 화면
- ✅ 카메라/갤러리 사진 선택
- ✅ 금액, 카테고리, 설명 입력
- ✅ 실제 데이터베이스 저장
- ✅ 입력 유효성 검사
- ✅ 로딩 상태 및 오류 처리

### 3. **FamilyDetailScreen** - 가족방 상세 화면
- ✅ 실시간 가계부 목록 표시
- ✅ 썸네일 이미지 표시
- ✅ 카테고리별 색상 구분
- ✅ 총 지출 금액 표시
- ✅ Pull-to-refresh 기능

## 🚀 설치 및 설정

### 1단계: Supabase Storage 설정
```sql
-- Supabase Dashboard > SQL Editor에서 실행
-- supabase-storage-setup.sql 파일 내용 실행
```

### 2단계: 앱 재시작
```bash
cd /Users/minjongmun/wheresmoney/wheresmoney
npm start
```

### 3단계: 테스트 시나리오
1. **로그인** → 가족방 입장
2. **FAB 버튼** → 가계부 작성 화면 이동
3. **사진 촬영/선택** → 이미지 추가
4. **정보 입력** → 금액, 카테고리, 설명
5. **저장 버튼** → 실제 저장 테스트
6. **가족방 돌아가기** → 목록에 표시 확인

## 📊 주요 기능

### 가계부 작성
- 📸 **필수 사진 첨부** - 영수증, 구매 증빙
- 💰 **금액 입력** - 숫자 키보드 최적화
- 🏷️ **카테고리 선택** - 8가지 색상별 카테고리
- 📝 **설명 작성** - 다줄 텍스트 입력

### 가계부 목록
- 🖼️ **썸네일 이미지** - 40x40 크기 미리보기
- 🎨 **카테고리 표시** - 색상별 칩으로 구분
- 💰 **총 지출 표시** - 상단 헤더에 합계
- 🔄 **실시간 새로고침** - Pull-to-refresh

### Storage 관리
- 📁 **사용자별 폴더** - /user_id/family_id/ 구조
- 🔒 **보안 정책** - 소유자만 업로드/삭제 가능
- 🌐 **공개 읽기** - 모든 가족 구성원이 이미지 조회 가능
- 📏 **용량 제한** - 5MB per 파일

## 🎯 사용법

### 가계부 작성하기
```
1. 가족방 진입
2. 우하단 + 버튼 터치
3. 사진 추가 (카메라 or 갤러리)
4. 금액 입력 (숫자만)
5. 카테고리 선택 (8가지 중 1개)
6. 내용 작성 (구매 내역 설명)
7. 저장 버튼 → 완료!
```

### 가계부 보기
```
1. 가족방에서 "가계부" 탭 확인
2. 최신순으로 정렬된 목록 표시
3. 썸네일 + 금액 + 설명 + 카테고리
4. 아래로 당겨서 새로고침 가능
```

## 🛠️ 기술 세부사항

### 이미지 처리
```typescript
// 이미지 업로드 플로우
1. ImagePicker로 로컬 이미지 선택
2. Fetch API로 blob 변환
3. Supabase Storage에 업로드
4. Public URL 생성
5. DB에 URL 저장
```

### 데이터 모델
```typescript
ledger_entries {
  id: UUID (Primary Key)
  family_id: UUID (Foreign Key)
  user_id: UUID (Foreign Key)  
  amount: number
  category_id: string
  description: string
  photo_url: string (Supabase Storage URL)
  date: string (YYYY-MM-DD)
  created_at: timestamp
}
```

### 폴더 구조
```
src/services/ledger.ts         - 가계부 비즈니스 로직
src/screens/ledger/            - 가계부 관련 화면들  
src/screens/family/            - 가족방 관련 화면들
src/constants/categories.ts    - 카테고리 정의
supabase-storage-setup.sql     - Storage 설정 SQL
```

## 🎉 완료!

이제 사용자들이 사진과 함께 가계부를 기록하고, 가족 구성원들이 실시간으로 모든 지출 내역을 확인할 수 있습니다!

**다음 개발 단계**: 통계 차트, 카테고리별 필터링, 가계부 수정/삭제 기능