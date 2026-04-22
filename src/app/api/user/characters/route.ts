import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/backend/db/supabase-server';

/**
 * 自分が作成したキャラクター一覧を取得する
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: characters, error } = await adminSupabase
      .from('characters')
      .select(`
        *,
        rooms(id, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
