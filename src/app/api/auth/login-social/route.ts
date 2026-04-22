import { NextResponse } from 'next/server';
import { createServerClient } from '@/backend/db/supabase-server';

export async function POST(request: Request) {
  try {
    const { provider } = await request.json();
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return NextResponse.json({ url: data.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
