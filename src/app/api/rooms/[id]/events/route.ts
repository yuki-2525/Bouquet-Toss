import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/backend/db/supabase-server';

/**
 * リアルタイム更新用の SSE (Server-Sent Events) エンドポイント
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  const adminSupabase = createAdminClient();

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
            sendEvent({ type: 'CHARACTER_UPDATE', data: payload.payload });
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
              sendEvent({ type: 'CHARACTER_UPDATE', data: char });
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
            sendEvent({ type: 'CHARACTER_INSERT', data: payload.new });
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
