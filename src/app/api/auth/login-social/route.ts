import { NextResponse } from 'next/server';
import { createServerClient } from '@/backend/db/supabase-server';
import { getAppOrigin } from '@/shared/utils/url';

export async function POST(request: Request) {
  try {
    const { provider, redirect } = await request.json();

    // プロバイダーの検証
    const allowedProviders = ['google', 'discord', 'twitter', 'github']; // githubも一応追加
    if (!allowedProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid auth provider' }, { status: 400 });
    }

    // redirectが安全か検証（URL全体ではなくパスのみを許可）
    const safeRedirect = (redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/\\')) ? redirect : '/';

    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getAppOrigin(request)}/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`,
      },
    });

    if (error) throw error;

    return NextResponse.json({ url: data.url });
  } catch (error: any) {
    console.error('Social login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
