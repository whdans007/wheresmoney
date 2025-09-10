-- 사용자 알림 설정 테이블
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ledger_entries BOOLEAN DEFAULT true,
    family_invites BOOLEAN DEFAULT true,
    member_joins BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- 사용자 푸시 토큰 저장 테이블
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    push_token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, push_token)
);

-- 알림 히스토리 테이블 (선택사항 - 알림 기록 추적용)
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'ledger_entry', 'family_invite', 'member_join'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    read_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false
);

-- RLS 정책 설정
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- 사용자 알림 설정 RLS 정책
CREATE POLICY "Users can manage their own notification settings"
    ON user_notification_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 푸시 토큰 RLS 정책
CREATE POLICY "Users can manage their own push tokens"
    ON user_push_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 알림 히스토리 RLS 정책
CREATE POLICY "Users can view their own notification history"
    ON notification_history
    FOR SELECT
    USING (auth.uid() = recipient_user_id);

CREATE POLICY "System can insert notification history"
    ON notification_history
    FOR INSERT
    WITH CHECK (true); -- 시스템에서만 삽입하므로 제한 없음

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_family ON notification_history(family_id, sent_at DESC);