/**
 * ブラウザ（クライアントコンポーネント）用 Supabase クライアント
 * next/headers などサーバー専用APIは一切importしないこと
 */
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;



/**
 * Middleware 専用 Supabase クライアント
 * Request/Response オブジェクトを直接受け取ってCookieを操作する
 */
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
}
