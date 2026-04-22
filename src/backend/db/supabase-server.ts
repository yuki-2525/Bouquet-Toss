/**
 * サーバー専用 Supabase クライアント
 * このファイルはサーバーコンポーネント・API Route からのみimportすること
 * クライアントコンポーネントからimportすると next/headers エラーになる
 */
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

/**
 * Server Component / API Route 用 Supabase クライアント
 * next/headers の cookies() からセッションを読み取る
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component から呼ばれた場合は set が使えないが無視してOK
        }
      },
    },
  });
}

/**
 * 管理者クライアント（API Route のサーバー処理専用）
 * service_role キーを使いRLSをバイパスする。ブラウザからは絶対に呼ばないこと。
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
