import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';
import { checkRateLimit } from '@/backend/utils/ratelimit';

export async function POST(request: Request) {
  try {
    let { displayName } = await request.json();

    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`guest_login_${clientIp}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // バリデーション: 制御文字を削除し、30文字に制限
    displayName = displayName.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().slice(0, 30);
    if (!displayName) {
      return NextResponse.json({ error: 'Invalid display name' }, { status: 400 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
