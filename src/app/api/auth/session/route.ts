import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ user: null });
    }

    // 以前の fetchProfile ロジックをここで行う (Admin権限でDBを参照)
    const adminSupabase = createAdminClient();
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!dbUser) {
      // DBにない場合はフォールバック
      return NextResponse.json({
        user: {
          id: authUser.id,
          displayName: authUser.user_metadata?.display_name || "ゲスト",
          avatarUrl: authUser.user_metadata?.avatar_url || null,
          isGuest: authUser.is_anonymous ?? false,
          needsRegistration: true // 登録が必要であることを示すフラグ
        }
      });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        displayName: dbUser.display_name,
        avatarUrl: dbUser.avatar_url,
        isGuest: dbUser.is_guest,
        needsRegistration: false
      }
    });
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message });
  }
}
