import { NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. トークンの検証とルーム情報の取得
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, allow_owner_view_stats, overlay_token')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // トークンが一致するかチェック
  if (room.overlay_token !== token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  // 統計閲覧権限がオフの場合はアクセス不可
  if (!room.allow_owner_view_stats) {
    return NextResponse.json({ error: 'Overlay is disabled for this room' }, { status: 403 });
  }

  // 2. キャラクター一覧を取得
  const { data: characters, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true });

  if (charError) {
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }

  return NextResponse.json({
    room: {
      id: room.id,
      name: room.name
    },
    characters: characters.map(c => ({
      id: c.id,
      name: c.name,
      avatarUrl: c.avatar_url,
      totalBouquets: c.total_bouquets_received
    }))
  });
}
