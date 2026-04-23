import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createAdminClient();

  // 1. 部屋主チェック
  const { data: room } = await adminSupabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .single();

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.created_by !== user.id) {
    return NextResponse.json({ error: 'Only the room owner can end Stella Battle' }, { status: 403 });
  }

  // 2. ルームの状態を更新
  const { error } = await adminSupabase
    .from('rooms')
    .update({ stella_battle_active: false })
    .eq('id', roomId);

  if (error) return NextResponse.json({ error: 'Failed to update room state' }, { status: 500 });

  // 3. SSEで通知
  await adminSupabase.channel(`room:${roomId}`).send({
    type: 'broadcast',
    event: 'STELLA_BATTLE_END',
    payload: { roomId }
  });

  return NextResponse.json({ success: true });
}
