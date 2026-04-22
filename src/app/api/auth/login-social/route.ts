import { NextResponse } from 'next/server';
import { createServerClient } from '@/backend/db/supabase-server';

export async function POST(request: Request) {
  try {
    const { provider, redirect } = await request.json();
    // redirectが安全か検証（URL全体ではなくパスのみを許可）
    const safeRedirect = (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/';

    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${new URL(request.url).origin}/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`,
      },
    });

    if (error) throw error;

    return NextResponse.json({ url: data.url });
  } catch (error: any) {
    console.error('Social login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
