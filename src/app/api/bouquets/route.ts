import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';
import { checkRateLimit } from '@/backend/utils/ratelimit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, characterId, count } = body;

    // 厳密な数値チェック (NaN, 小数, Infinity 対策)
    if (!roomId || !characterId || !Number.isInteger(count)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 上限・下限チェック（-1,000,000 〜 +1,000,000）
    // 1回あたりの上限を1,000,000に制限します。
    if (count < -1000000 || count > 1000000) {
      return NextResponse.json({ error: 'Count out of range. Max is 1,000,000 per request.' }, { status: 400 });
    }

    // 数が0の場合は何もしない
    if (count === 0) {
      return NextResponse.json({ success: true, message: 'Skipped' });
    }

    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // レートリミット (1分間に30回まで)
    // IPアドレスベースが理想ですが、Vercelのrequest.ipは取得できない場合があるためユーザーIDで制限します。
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const limitKey = `bouquets_${userId}_${clientIp}`;
    if (!checkRateLimit(limitKey, 30, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = createAdminClient();

    // 1. ルームへのアクセス権限をチェック
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.created_by !== userId) {
      const { data: access } = await supabase
        .from('room_access')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!access) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this room' }, { status: 403 });
      }
    }

    // 2. キャラクターが指定されたルームに属しているかチェック (嫌がらせ防止)
    const { data: charCheck } = await supabase
      .from('characters')
      .select('id')
      .eq('id', characterId)
      .eq('room_id', roomId)
      .maybeSingle();

    if (!charCheck) {
      return NextResponse.json({ error: 'Character not found in this room' }, { status: 404 });
    }

    // Supabase RPC (increment_bouquet) を呼び出してアトミックに加算
    // ※マイナスのcount（取り消し）も許容するため、そのまま渡す
    const { data, error } = await supabase.rpc('increment_bouquet', {
      p_room_id: roomId,
      p_character_id: characterId,
      p_user_id: userId,
      p_count: count
    });

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 更新後のキャラクター情報を取得
    const { data: char } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (char) {
      // リアルタイム通知をブロードキャスト
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'CHARACTER_UPDATE',
        payload: char
      });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Bouquet API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
