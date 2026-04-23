import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  const { coefficient = 1.0 } = await request.json(); // 係数 (100% = 1.0)

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createAdminClient();

  // 1. 部屋主チェック
  const { data: room } = await adminSupabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.created_by !== user.id) {
    return NextResponse.json({ error: 'Only the room owner can start Stella Battle' }, { status: 403 });
  }

  // 2. キャラクター一覧を取得して初期値を計算
  const { data: characters } = await adminSupabase
    .from('characters')
    .select('*')
    .eq('room_id', roomId);

  if (!characters) return NextResponse.json({ error: 'No characters found' }, { status: 404 });

  // 3. 各キャラクターのステラバトル用ブーケ数を更新
  // CEIL(total_bouquets_received * coefficient)
  const updates = characters.map(char => {
    const initialBouquets = Math.ceil((Number(char.total_bouquets_received) || 0) * coefficient);
    return adminSupabase
      .from('characters')
      .update({ stella_battle_bouquets: initialBouquets })
      .eq('id', char.id);
  });

  await Promise.all(updates);

  // 4. ルームの状態を更新
  const { error: roomUpdateError } = await adminSupabase
    .from('rooms')
    .update({
      stella_battle_active: true,
      stella_battle_coefficient: coefficient
    })
    .eq('id', roomId);

  if (roomUpdateError) return NextResponse.json({ error: 'Failed to update room state' }, { status: 500 });

  // 5. SSEで全ユーザーに通知 (ブロードキャスト)
  await adminSupabase.channel(`room:${roomId}`).send({
    type: 'broadcast',
    event: 'STELLA_BATTLE_START',
    payload: { roomId, coefficient }
  });

  return NextResponse.json({ success: true, coefficient });
}
