import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

/**
 * 新しいキャラ（キャラクター）を追加する
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    let { name, avatarUrl } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // バリデーション: name (制御文字除去 + 30文字制限)
    name = name.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().slice(0, 30);
    if (!name) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    // バリデーション: avatarUrl (カンマ区切り対応, https:// のみ許可)
    if (avatarUrl) {
      const urls = avatarUrl.split(',').map((u: string) => u.trim()).filter(Boolean);
      if (urls.length > 3) {
        return NextResponse.json({ error: 'Too many avatar URLs (max 3)' }, { status: 400 });
      }
      for (const u of urls) {
        try {
          const urlObj = new URL(u);
          if (urlObj.protocol !== 'https:') {
            return NextResponse.json({ error: 'All Avatar URLs must be https' }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: 'Invalid Avatar URL format' }, { status: 400 });
        }
      }
      avatarUrl = urls.join(',');
    }

    // セッションからユーザーID取得 (IDOR対策)
    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
