-- 사용자 프로필 테이블
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 가족방 테이블
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 가족방 멤버 테이블
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 가계부 카테고리 테이블
CREATE TABLE ledger_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false
);

-- 기본 카테고리 데이터 삽입
INSERT INTO ledger_categories (name, color, icon, is_default) VALUES
('식비', '#FF6B6B', 'food', true),
('교통비', '#4ECDC4', 'car', true),
('쇼핑', '#45B7D1', 'shopping-bag', true),
('의료비', '#96CEB4', 'medical-bag', true),
('교육', '#FFEAA7', 'school', true),
('오락', '#DDA0DD', 'gamepad-variant', true),
('생활용품', '#98D8C8', 'home', true),
('기타', '#CDCDCD', 'dots-horizontal', true);

-- 가계부 내역 테이블
CREATE TABLE ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES ledger_categories(id),
  description TEXT NOT NULL,
  photo_url TEXT NOT NULL, -- 사진 필수
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 가족방은 멤버만 조회 가능
CREATE POLICY "Family members can view family" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE family_id = families.id AND user_id = auth.uid()
    )
  );

-- 가족방 소유자만 수정 가능
CREATE POLICY "Family owners can update family" ON families
  FOR UPDATE USING (owner_id = auth.uid());

-- 가족방 멤버 조회 정책
CREATE POLICY "Family members can view members" ON family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm2 
      WHERE fm2.family_id = family_members.family_id AND fm2.user_id = auth.uid()
    )
  );

-- 가계부 내역은 같은 가족방 멤버만 조회 가능
CREATE POLICY "Family members can view ledger entries" ON ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE family_id = ledger_entries.family_id AND user_id = auth.uid()
    )
  );

-- 가계부 내역은 작성자나 가족방 소유자만 수정/삭제 가능
CREATE POLICY "Users can update own ledger entries" ON ledger_entries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM families 
      WHERE id = ledger_entries.family_id AND owner_id = auth.uid()
    )
  );

-- 사용자 생성 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, nickname)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 등록 시 프로필 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ledger_entries_updated_at BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();