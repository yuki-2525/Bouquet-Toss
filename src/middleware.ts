import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/backend/db/supabase';
import { getAppOrigin } from '@/shared/utils/url';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // セッショントークンをリフレッシュ（期限切れ防止）
  const { data: { session } } = await supabase.auth.getSession();

  const isRoomPath = request.nextUrl.pathname.startsWith('/rooms/');

  // 未ログインで /rooms/* にアクセスした場合、/login にリダイレクト
  // （ログインページ自体は /login?redirect=... でリダイレクト先を保持する）
  if (isRoomPath && !session) {
    const redirectUrl = new URL('/login', getAppOrigin(request));
    const targetPath = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set('redirect', targetPath);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // next.jsの内部ルートと静的ファイルを除外
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
