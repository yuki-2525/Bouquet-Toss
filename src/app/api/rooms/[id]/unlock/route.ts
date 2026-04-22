import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';
import crypto from 'crypto';

/**
 * ルームのパスワード認証を行い、アクセス権を付与する
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // パスワードのハッシュ化 (SHA-256)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

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
    if (room.password_hash !== passwordHash) {
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
