-- 1. テーブルのRLSを有効化（フロントエンドからの直接アクセスを全てブロック）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouquet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_access ENABLE ROW LEVEL SECURITY;

-- 2. 1000万ブーケ投下によるオーバーフローを防ぐため、合計カラムを BIGINT に変更
ALTER TABLE public.characters ALTER COLUMN total_bouquets_received TYPE BIGINT;
ALTER TABLE public.users ALTER COLUMN total_bouquets_sent TYPE BIGINT;
