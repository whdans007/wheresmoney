-- Storage 버킷 생성 (Supabase Dashboard의 Storage에서 실행)
-- 버킷 이름: ledger-photos
-- Public: false (인증된 사용자만 접근)

-- RLS 정책 설정 (SQL Editor에서 실행)
-- 인증된 사용자만 자신의 사진 업로드 가능
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ledger-photos' 
    AND auth.role() = 'authenticated'
  );

-- 가족방 멤버만 사진 조회 가능
CREATE POLICY "Family members can view photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ledger-photos' 
    AND auth.role() = 'authenticated'
  );

-- 사진 소유자만 삭제 가능
CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ledger-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );