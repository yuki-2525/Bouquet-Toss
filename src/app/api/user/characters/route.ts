import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

/**
 * 自分が作成したキャラクター一覧を取得する
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

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
    console.error('List user characters error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
