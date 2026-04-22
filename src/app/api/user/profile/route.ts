import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';

/**
 * ユーザープロフィール（表示名など）を更新する
 */
export async function PATCH(request: Request) {
  try {
    // 認証チェックには通常のクライアントを使用
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { displayName } = await request.json();

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // DB更新には確実に書き込めるよう Admin権限を使用
    const adminSupabase = createAdminClient();
    
    // 1. usersテーブルを更新
    const { error: dbError } = await adminSupabase
      .from('users')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);

    if (dbError) throw dbError;

    // 2. Authのメタデータも更新（AuthContextで反映されるようにするため）
    // updateUser は現在のユーザーセッションが必要なため、通常のクライアントを使用
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() }
    });

    if (authError) throw authError;

    return NextResponse.json({ success: true, displayName: displayName.trim() });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 自分のプロフィール情報を取得する
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: userData, error } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
