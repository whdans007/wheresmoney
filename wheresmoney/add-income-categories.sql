-- 수입 카테고리 추가
INSERT INTO ledger_categories (name, color, icon, is_default) VALUES
('급여', '#4CAF50', 'cash', true),
('용돈', '#8BC34A', 'gift', true),
('부업', '#2E7D32', 'briefcase', true),
('투자수익', '#388E3C', 'trending-up', true),
('기타수입', '#689F38', 'plus-circle', true);

-- 추가된 카테고리 확인
SELECT id, name, color, icon, is_default FROM ledger_categories ORDER BY name;