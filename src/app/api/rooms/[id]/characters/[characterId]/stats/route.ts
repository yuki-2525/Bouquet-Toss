import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

/**
 * キャラクターごとのブーケ投下内訳（誰から何個もらったか）を取得する
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { id: roomId, characterId } = await params;
    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const supabase = createAdminClient();

    // 1. 権限チェック（キャラクターのオーナー or ルーム作成者のみ）
    const { data: char, error: charError } = await supabase
      .from('characters')
      .select('user_id, rooms(created_by)')
      .eq('id', characterId)
      .single();

    if (charError || !char) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const roomCreator = (char.rooms as any)?.created_by;
    if (char.user_id !== userId && roomCreator !== userId) {
      // オーナーでもルーム作成者でもない場合、個別の閲覧権限をチェック
      const { data: access } = await supabase
        .from('character_access')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // 2. ブーケ投下ログをユーザーごとに集計して取得
    // countをSUMし、usersテーブルから名前とアバターを結合
    const { data: logs, error: logsError } = await supabase
      .from('bouquet_logs')
      .select(`
        count,
        from_user_id,
        users:from_user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('to_character_id', characterId);

    if (logsError) throw logsError;

    // ユーザーごとに集計
    const breakdownMap = new Map<string, { name: string; avatarUrl: string | null; count: number }>();

    logs.forEach((log: any) => {
      const uId = log.from_user_id || 'anonymous';
      const userData = log.users || { display_name: 'ゲスト', avatar_url: null };
      
      const existing = breakdownMap.get(uId);
      if (existing) {
        existing.count += log.count;
      } else {
        breakdownMap.set(uId, {
          name: userData.display_name,
          avatarUrl: userData.avatar_url,
          count: log.count
        });
      }
    });

    const breakdown = Array.from(breakdownMap.values())
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      breakdown
    });
  } catch (error: any) {
    console.error('Stats breakdown error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
