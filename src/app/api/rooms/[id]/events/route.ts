import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

/**
 * リアルタイム更新用の SSE (Server-Sent Events) エンドポイント
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  // セッション認証
  const supabaseSession = await createServerClient();
  const { data: { user } } = await supabaseSession.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = user.id;

  const adminSupabase = createAdminClient();

  // アクセス権の確認
  const { data: room } = await adminSupabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .single();

  if (!room) return new Response('Not Found', { status: 404 });

  let hasAccess = room.created_by === userId;
  if (!hasAccess) {
    const { data: access } = await adminSupabase
      .from('room_access')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();
    hasAccess = !!access;
  }

  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 });
  }

  // 閲覧権限を持つキャラクターIDのリストを取得
  // 1. 自分がオーナーであるキャラ
  const { data: myChars } = await adminSupabase
    .from('characters')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId);
  
  // 2. 閲覧権限が付与されているキャラ
  const { data: sharedChars } = await adminSupabase
    .from('character_access')
    .select('character_id')
    .eq('user_id', userId);

  const viewableCharIds = new Set([
    ...(myChars?.map(c => c.id) || []),
    ...(sharedChars?.map(c => c.character_id) || [])
  ]);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // クライアントにデータを送るヘルパー
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 1. ブロードキャストメッセージ（APIからの直接通知）を待受ける
      const broadcastChannel = adminSupabase
        .channel(`room:${roomId}`)
        .on(
          'broadcast',
          { event: 'CHARACTER_UPDATE' },
          (payload) => {
            if (!payload?.payload) return;
            const charId = payload.payload.id;
            const safeData = { ...payload.payload };
            
            // 権限がない場合は合計値を削除
            if (!viewableCharIds.has(charId)) {
              delete safeData.total_bouquets_received;
            }
            
            sendEvent({ type: 'CHARACTER_UPDATE', data: safeData });
          }
        )
        .on(
          'broadcast',
          { event: 'STELLA_BATTLE_START' },
          (payload) => {
            if (!payload?.payload) return;
            sendEvent({ type: 'STELLA_BATTLE_START', data: payload.payload });
          }
        )
        .on(
          'broadcast',
          { event: 'STELLA_BATTLE_UPDATE' },
          (payload) => {
            if (!payload?.payload) return;
            sendEvent({ type: 'STELLA_BATTLE_UPDATE', data: payload.payload });
          }
        )
        .on(
          'broadcast',
          { event: 'STELLA_BATTLE_END' },
          (payload) => {
            if (!payload?.payload) return;
            sendEvent({ type: 'STELLA_BATTLE_END', data: payload.payload });
          }
        )
        .subscribe();

      // 2. ブーケ投下ログを監視（バックアップ用の監視）
      const logChannel = adminSupabase
        .channel(`room-logs-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bouquet_logs',
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => {
            const charId = payload.new.to_character_id;
            // 最新のキャラクター情報を取得
            const { data: char } = await adminSupabase
              .from('characters')
              .select('*')
              .eq('id', charId)
              .single();
            
            if (char) {
              const safeData = { ...char };
              if (!viewableCharIds.has(charId)) {
                delete safeData.total_bouquets_received;
              }
              sendEvent({ type: 'CHARACTER_UPDATE', data: safeData });
            }
          }
        )
        .subscribe();

      // 2. 新しいキャラクターの追加を監視
      const charChannel = adminSupabase
        .channel(`room-chars-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'characters',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            if (!payload?.new) return;
            const charId = payload.new.id;
            const safeData = { ...payload.new };
            
            if (!viewableCharIds.has(charId)) {
              delete safeData.total_bouquets_received;
            }
            sendEvent({ type: 'CHARACTER_INSERT', data: safeData });
          }
        )
        .subscribe();

      // 2. 参加メンバーの更新を監視
      const memberChannel = adminSupabase
        .channel(`room-members-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_access',
            filter: `room_id=eq.${roomId}`,
          },
          async () => {
            // メンバー一覧を再取得して送る
            const { data: members } = await adminSupabase
              .from('room_access')
              .select('users(id, display_name, avatar_url)')
              .eq('room_id', roomId);
            
            const formattedMembers = members?.map((m: any) => ({
              id: m.users.id,
              name: m.users.display_name,
              avatarUrl: m.users.avatar_url
            })) || [];

            sendEvent({ type: 'MEMBERS_UPDATE', data: formattedMembers });
          }
        )
        .subscribe();

      // 接続維持のためのキープアライブ (30秒おき)
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 30000);

      // 切断時のクリーンアップ
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        broadcastChannel.unsubscribe();
        logChannel.unsubscribe();
        charChannel.unsubscribe();
        memberChannel.unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
