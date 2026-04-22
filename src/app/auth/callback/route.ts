import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawRedirect = searchParams.get('redirect') || '/';
  // Open Redirect 対策
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\')
    ? rawRedirect : '/';

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const adminClient = createAdminClient();
      
      // 1. public.users テーブルにユーザーが既に存在し、名前が登録されているか確認
      const { data: existingUser } = await adminClient
        .from('users')
        .select('display_name')
        .eq('id', data.user.id)
        .maybeSingle();

      // 2. アバター情報などは最新に更新しておく
      const avatarUrl =
        data.user.user_metadata?.avatar_url ||
        data.user.user_metadata?.picture ||
        null;

      if (!existingUser) {
        // 初回ログイン: IDとアバターだけ作成し、名前は未設定のまま /register へ
        await adminClient.from('users').insert({
          id: data.user.id,
          avatar_url: avatarUrl,
          is_guest: false
        });
        return NextResponse.redirect(`${origin}/register?redirect=${encodeURIComponent(redirect)}`);
      }

      if (!existingUser.display_name) {
        // レコードはあるが名前が空の場合も /register へ
        return NextResponse.redirect(`${origin}/register?redirect=${encodeURIComponent(redirect)}`);
      }

      // 名前登録済みなら、アバターだけ更新して目的地へ
      await adminClient.from('users').update({ avatar_url: avatarUrl }).eq('id', data.user.id);
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // エラーの場合はログインページへ
  console.error('Auth callback error: no code or exchange failed');
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
