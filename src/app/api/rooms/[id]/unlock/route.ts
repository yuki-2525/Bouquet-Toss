import { NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

/**
 * ルームのパスワード認証を行い、アクセス権を付与する
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const { password, userId } = await request.json();

    if (!password || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. ルームのパスワードを確認
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('password_hash')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // パスワード照合
    if (room.password_hash !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // 2. 正しければアクセス権を記録
    const { error: accessError } = await supabase
      .from('room_access')
      .upsert({
        room_id: roomId,
        user_id: userId
      }, { onConflict: 'room_id, user_id' });

    if (accessError) throw accessError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unlock error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
