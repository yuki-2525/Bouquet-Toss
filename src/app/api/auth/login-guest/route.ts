import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';

export async function POST(request: Request) {
  try {
    const { displayName } = await request.json();

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // 1. 匿名サインイン
    const { data: { user }, error: authError } = await supabase.auth.signInAnonymously();

    if (authError || !user) throw authError || new Error("Auth failed");

    // 2. Admin権限でDBに名前を登録 (RLSをバイパスして確実に登録)
    const adminSupabase = createAdminClient();
    const { error: dbError } = await adminSupabase
      .from('users')
      .upsert({
        id: user.id,
        display_name: displayName,
        is_guest: true
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Guest login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
