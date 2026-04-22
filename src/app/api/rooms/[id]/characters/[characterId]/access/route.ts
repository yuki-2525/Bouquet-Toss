import { NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

/**
 * キャラクターの統計閲覧権限（共有ユーザー）を管理する
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { id: roomId, characterId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. 権限チェック（本人がそのキャラのオーナーであること）
    const { data: char, error: charError } = await supabase
      .from('characters')
      .select('user_id')
      .eq('id', characterId)
      .single();

    if (charError || !char || char.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. ルームに参加しているユーザー一覧を取得 (room_accessテーブル経由)
    const { data: roomMembers, error: membersError } = await supabase
      .from('room_access')
      .select('user_id, users(id, display_name, avatar_url)')
      .eq('room_id', roomId);

    if (membersError) throw membersError;

    // 3. 現在このキャラの閲覧権限を持っているユーザーID一覧を取得
    const { data: authorizedUsers, error: authError } = await supabase
      .from('character_access')
      .select('user_id')
      .eq('character_id', characterId);

    if (authError) throw authError;

    const authSet = new Set(authorizedUsers.map(a => a.user_id));

    // 整形して返す（自分自身は除外）
    const result = roomMembers
      .map((m: any) => ({
        id: m.users.id,
        name: m.users.display_name,
        avatarUrl: m.users.avatar_url,
        hasAccess: authSet.has(m.users.id)
      }))
      .filter(m => m.id !== userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get character access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 閲覧権限の切り替え（トグル）
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const { targetUserId, userId, hasAccess } = await request.json();

    if (!targetUserId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 権限チェック（オーナーのみ）
    const { data: char } = await supabase
      .from('characters')
      .select('user_id')
      .eq('id', characterId)
      .single();

    if (char?.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (hasAccess) {
      // 権限付与
      await supabase
        .from('character_access')
        .upsert({ character_id: characterId, user_id: targetUserId }, { onConflict: 'character_id, user_id' });
    } else {
      // 権限削除
      await supabase
        .from('character_access')
        .delete()
        .eq('character_id', characterId)
        .eq('user_id', targetUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Toggle character access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
