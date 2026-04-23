-- ステラバトル用のカラム追加
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS stella_battle_active BOOLEAN DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS stella_battle_coefficient FLOAT DEFAULT 1.0;

ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS stella_battle_bouquets BIGINT DEFAULT 0;
