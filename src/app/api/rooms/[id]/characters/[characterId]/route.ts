import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';

/**
 * キャラクター情報の更新 (名前、画像URLなど)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, characterId: string }> }
) {
  try {
    const { id: roomId, characterId } = await params;
    const body = await request.json();
    const { name, avatarUrl } = body;

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // オーナーチェック
    const { data: character } = await adminSupabase
      .from('characters')
      .select('user_id')
      .eq('id', characterId)
      .single();

    if (!character || character.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 更新実行
    const { data, error } = await adminSupabase
      .from('characters')
      .update({
        name: name !== undefined ? name : undefined,
        avatar_url: avatarUrl !== undefined ? avatarUrl : undefined,
      })
      .eq('id', characterId)
      .select()
      .single();

    if (error) throw error;

    // リアルタイム通知（オプションで入れるならここ）
    // await adminSupabase.channel(`room:${roomId}`).send({...});

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Update character error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * キャラクターの削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // オーナーチェック
    const { data: character } = await adminSupabase
      .from('characters')
      .select('user_id')
      .eq('id', characterId)
      .single();

    if (!character || character.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await adminSupabase
      .from('characters')
      .delete()
      .eq('id', characterId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
