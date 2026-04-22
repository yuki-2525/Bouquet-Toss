import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/backend/utils/ratelimit';

/**
 * ユーザーに関連するルーム（作成したルーム ＋ アクセス権を持つルーム）を一覧取得する
 */
export async function GET(request: Request) {
  try {
    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const supabase = createAdminClient();

    // 1. 自分が作成したルームを取得
    const { data: createdRooms, error: createdError } = await supabase
      .from('rooms')
      .select('id, name, created_at, created_by')
      .eq('created_by', userId);

    if (createdError) {
      console.error('CreatedRooms Error:', createdError);
      throw createdError;
    }

    // 2. アクセス権（room_access）を持つルームのIDを取得
    const { data: accessRecords, error: accessError } = await supabase
      .from('room_access')
      .select('room_id, rooms:rooms(id, name, created_at, created_by)')
      .eq('user_id', userId);

    if (accessError) {
      console.error('AccessRecords Error:', accessError);
      throw accessError;
    }

    // 3. データをマージして重複を排除
    const accessedRooms = accessRecords
      .map((record: any) => record.rooms)
      .filter(Boolean);

    const roomMap = new Map();
    [...createdRooms, ...accessedRooms].forEach(room => {
      roomMap.set(room.id, room);
    });

    const allRooms = Array.from(roomMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(allRooms);
  } catch (error: any) {
    console.error('List rooms error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * 新規ルーム作成
 */
export async function POST(request: Request) {
  try {
    let { name, password, allowOwnerManageAll, allowOwnerViewStats } = await request.json();

    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`create_room_${clientIp}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    name = name.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().slice(0, 50);
    if (!name) {
      return NextResponse.json({ error: 'Invalid room name' }, { status: 400 });
    }

    const supabaseSession = await createServerClient();
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // パスワードのハッシュ化 (bcrypt)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const supabase = createAdminClient();

    // 1. ルームを作成
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        password_hash: passwordHash,
        created_by: userId,
        allow_owner_manage_all: !!allowOwnerManageAll,
        allow_owner_view_stats: allowOwnerViewStats !== undefined ? !!allowOwnerViewStats : true
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // 2. 作成者は自動的にアクセス権を持つ
    await supabase
      .from('room_access')
      .insert({ room_id: room.id, user_id: userId });

    return NextResponse.json(room);
  } catch (error: any) {
    console.error('Room creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
