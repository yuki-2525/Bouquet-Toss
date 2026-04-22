import { NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

interface CharacterOrder {
  id: string;
  sort_order: number;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { userId, characters }: { userId: string; characters: CharacterOrder[] } = body;

    // バリデーション
    if (!userId || !Array.isArray(characters) || characters.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ルーム情報を取得し、作成者かどうかを確認する
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only room creator can reorder characters' }, { status: 403 });
    }

    // 各キャラクターの sort_order を更新
    const updates = characters.map(({ id, sort_order }) =>
      supabase
        .from('characters')
        .update({ sort_order })
        .eq('id', id)
        .eq('room_id', roomId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      console.error('Sort order update errors:', errors);
      return NextResponse.json({ error: 'Failed to update some orders' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Order API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
