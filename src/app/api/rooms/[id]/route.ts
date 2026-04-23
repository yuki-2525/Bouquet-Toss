import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const supabase = createAdminClient();

    // 1. ルーム情報の取得
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 2. アクセス権の確認
    // 作成者本人でない場合は、room_accessテーブルを確認
    if (room.created_by !== userId) {
      const { data: access, error: accessError } = await supabase
        .from('room_access')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();

      if (accessError || !access) {
        return NextResponse.json({ 
          error: 'Access denied', 
          needsPassword: true 
        }, { status: 403 });
      }
    }

    // 3. キャラクター情報の取得
    const { data: characters, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (charError) {
      return NextResponse.json({ error: 'Characters not found' }, { status: 500 });
    }

    // 3. 送付ログから、そのuserIdが該当キャラに送った数を取得する
    let mySentCounts: Record<string, number> = {};
    if (userId) {
      const { data: logs, error: logsError } = await supabase
        .from('bouquet_logs')
        .select('to_character_id, count')
        .eq('room_id', roomId)
        .eq('from_user_id', userId);

      if (logs && !logsError) {
        mySentCounts = logs.reduce((acc, log) => {
          acc[log.to_character_id] = (acc[log.to_character_id] || 0) + log.count;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // 4. このユーザーが閲覧を許可されているキャラクターIDを取得
    const { data: sharedAccess } = await supabase
      .from('character_access')
      .select('character_id')
      .eq('user_id', userId);
    
    const sharedCharIds = new Set(sharedAccess?.map(a => a.character_id) || []);

    // 5. ルームの参加ユーザー一覧を取得
    const { data: members } = await supabase
      .from('room_access')
      .select('users(id, display_name, avatar_url)')
      .eq('room_id', roomId);

    const formattedMembers = members?.map((m: any) => ({
      id: m.users.id,
      name: m.users.display_name,
      avatarUrl: m.users.avatar_url
    })) || [];

    // 6. レスポンスの整形 (オーナー・共有ユーザーにのみ総数を返す)
    const formattedCharacters = characters.map((char) => {
      const isCharOwner = char.user_id === userId;
      const isRoomOwner = room.created_by === userId;
      const allowOwnerViewStats = room.allow_owner_view_stats !== false;
      
      const isOwner = isCharOwner || (isRoomOwner && allowOwnerViewStats);
      const isShared = sharedCharIds.has(char.id);
      
      return {
        id: char.id,
        name: char.name,
        avatarUrl: char.avatar_url,
        ownerId: char.user_id,
        mySentCount: mySentCounts[char.id] || 0,
        totalBouquets: (isOwner || isShared) ? char.total_bouquets_received : null
      };
    });

    const isRoomOwner = room.created_by === userId;

    return NextResponse.json({
      id: room.id,
      name: room.name,
      createdBy: room.created_by,
      allowOwnerManageAll: !!room.allow_owner_manage_all,
      allowOwnerViewStats: room.allow_owner_view_stats !== false, // default true
      overlayToken: isRoomOwner ? room.overlay_token : null,
      characters: formattedCharacters,
      members: formattedMembers
    });
    
  } catch (error: any) {
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * ルーム設定の更新 (名前、権限オプション)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    let { name, allowOwnerManageAll, allowOwnerViewStats } = await request.json();

    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. ルームの存在とオーナー確認
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. 更新データの準備
    const updateData: any = {};
    if (name !== undefined) {
      name = name.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().slice(0, 50);
      if (name) updateData.name = name;
    }
    if (allowOwnerManageAll !== undefined) {
      updateData.allow_owner_manage_all = !!allowOwnerManageAll;
    }
    if (allowOwnerViewStats !== undefined) {
      updateData.allow_owner_view_stats = !!allowOwnerViewStats;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    // 3. 更新実行
    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedRoom);
  } catch (error: any) {
    console.error('Update room error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
