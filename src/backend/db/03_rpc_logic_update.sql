-- 1. ブーケ投下RPCの更新（負の数による嫌がらせ・改ざん防止ロジックを追加）
CREATE OR REPLACE FUNCTION increment_bouquet(
  p_room_id UUID,
  p_character_id UUID,
  p_user_id UUID,
  p_count INTEGER
) RETURNS void AS $$
DECLARE
  v_my_sent BIGINT;
BEGIN
  -- 同一ユーザー、同一キャラクターに対する操作をシリアライズするためのアドバイザリーロック
  -- これにより、負の数による減算時のチェック（TOCTOU）の正確性を保証します。
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || p_character_id::text));

  -- 負の数（取り消し）の場合のバリデーション
  -- 自分が過去にそのキャラに贈った合計本数を超えてマイナスできないようにする
  IF p_count < 0 THEN
    SELECT COALESCE(SUM(count), 0) INTO v_my_sent
    FROM public.bouquet_logs
    WHERE from_user_id = p_user_id AND to_character_id = p_character_id;

    IF v_my_sent + p_count < 0 THEN
      RAISE EXCEPTION 'Cannot cancel more bouquets than you have sent to this character.';
    END IF;
  END IF;

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
