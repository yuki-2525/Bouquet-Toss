import { NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, characterId, userId, count } = body;

    // バリデーション
    if (!roomId || !characterId || !userId || typeof count !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 数が0の場合は何もしない
    if (count === 0) {
      return NextResponse.json({ success: true, message: 'Skipped' });
    }

    const supabase = createAdminClient();

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
