import { NextResponse } from 'next/server';
import { createServerClient } from '@/backend/db/supabase-server';

export async function POST() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
