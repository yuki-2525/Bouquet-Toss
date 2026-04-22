import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';
import { checkRateLimit } from '@/backend/utils/ratelimit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, characterId, count } = body;

    // 数値型チェック
    if (!roomId || !characterId || typeof count !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 上限・下限チェック（-1000万 〜 +1000万）
    if (count < -10000000 || count > 10000000) {
      return NextResponse.json({ error: 'Count out of range. Max is 10,000,000.' }, { status: 400 });
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
