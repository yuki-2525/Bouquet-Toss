-- rooms テーブルに overlay_token カラムを追加
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS overlay_token UUID DEFAULT uuid_generate_v4();

-- 既存のレコードにトークンが付与されていない場合のために（DEFAULTがあるので基本不要だが念のため）
UPDATE public.rooms SET overlay_token = uuid_generate_v4() WHERE overlay_token IS NULL;
