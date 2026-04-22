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
    let { name, avatarUrl } = body;

    if (name !== undefined) {
      name = name.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().slice(0, 30);
      if (!name) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    if (avatarUrl) {
      try {
        const urlObj = new URL(avatarUrl);
        if (urlObj.protocol !== 'https:') {
          return NextResponse.json({ error: 'Avatar URL must be https' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid Avatar URL format' }, { status: 400 });
      }
    }

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    console.error('Delete character error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
