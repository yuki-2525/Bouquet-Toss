import { NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

/**
 * 新しい騎士（キャラクター）を追加する
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const { name, userId, avatarUrl } = await request.json();

    if (!name || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. 権限チェック（ルーム作成者本人、またはアクセス権を持つユーザーのみ追加可能）
    const { data: room } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', roomId)
      .single();

    if (room?.created_by !== userId) {
      // オーナーでない場合はroom_accessを確認
      const { data: access } = await supabase
        .from('room_access')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // 2. 現在の最大ソート順を取得
    const { data: lastChar } = await supabase
      .from('characters')
      .select('sort_order')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastChar?.sort_order ?? -1) + 1;

    // 3. キャラクターを作成
    const { data: newChar, error: charError } = await supabase
      .from('characters')
      .insert({
        room_id: roomId,
        user_id: userId,
        name: name,
        avatar_url: avatarUrl || null,
        sort_order: nextOrder
      })
      .select()
      .single();

    if (charError) throw charError;

    // フロントエンドの型に合わせるための整形
    return NextResponse.json({
      id: newChar.id,
      name: newChar.name,
      avatarUrl: newChar.avatar_url,
      ownerId: newChar.user_id,
      mySentCount: 0
    });
  } catch (error: any) {
    console.error('Add character error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
