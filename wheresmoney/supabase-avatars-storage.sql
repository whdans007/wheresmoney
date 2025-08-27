-- 프로필 아바타 이미지 저장을 위한 Storage 버킷 설정

-- 1. avatars 버킷 생성
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
VALUES (
  'avatars',
  'avatars',
  true, -- 공개 읽기 허용
  false,
  2097152, -- 2MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp'],
  NULL
);

-- 2. Storage 정책 설정 - 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text -- 사용자별 폴더 제한
);

-- 3. Storage 정책 설정 - 모든 사용자가 읽기 가능 (공개)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Storage 정책 설정 - 소유자만 삭제 가능
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Storage 정책 설정 - 소유자만 수정 가능
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. 버킷 설정 확인
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- 7. 정책 확인
SELECT 
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%avatar%';