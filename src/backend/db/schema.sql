-- public.users ユーザーテーブル
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- ゲスト用はフロントから生成したUUIDを利用
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT true,
  total_bouquets_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- public.rooms ルームテーブル
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- public.characters キャラクター（騎士）テーブル
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- キャラクターを作成したユーザー（オーナー）
  name TEXT NOT NULL,
  avatar_url TEXT, -- キャラクターの画像URL
  total_bouquets_received INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0, -- 表示順（ルーム作成者が変更可能）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- public.bouquet_logs ブーケ投下ログテーブル
CREATE TABLE IF NOT EXISTS public.bouquet_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  count INTEGER NOT NULL CHECK (count > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 高速な集計のためのインデックス
CREATE INDEX IF NOT EXISTS idx_bouquet_logs_room_id ON public.bouquet_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_bouquet_logs_to_character ON public.bouquet_logs(to_character_id);

-- バッチ更新用ストアドプロシージャ (RPC)
CREATE OR REPLACE FUNCTION increment_bouquet(
  p_room_id UUID,
  p_character_id UUID,
  p_user_id UUID,
  p_count INTEGER
) RETURNS void AS $$
BEGIN
  -- ログの挿入
  INSERT INTO public.bouquet_logs (room_id, to_character_id, from_user_id, count)
  VALUES (p_room_id, p_character_id, p_user_id, p_count);

  -- キャラクターの合計カウントを更新
  UPDATE public.characters
  SET total_bouquets_received = total_bouquets_received + p_count
  WHERE id = p_character_id;

  -- ユーザーの合計カウントを更新
  IF p_user_id IS NOT NULL THEN
    UPDATE public.users
    SET total_bouquets_sent = total_bouquets_sent + p_count
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
