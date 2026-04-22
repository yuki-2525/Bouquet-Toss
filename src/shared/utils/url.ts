/**
 * アプリケーションのベースURL（Origin）を取得します。
 * 1. 環境変数 NEXT_PUBLIC_APP_URL が設定されている場合はそれを優先します。
 * 2. 設定されていない場合は、リクエストのURLから取得を試みます。
 * 3. いずれも利用できない場合は http://localhost:3000 を返します。
 */
export function getAppOrigin(request?: Request | { url: string }): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  if (request?.url) {
    try {
      return new URL(request.url).origin;
    } catch (e) {
      console.error('Invalid request URL for getAppOrigin:', request.url);
    }
  }

  // フォールバック
  return 'http://localhost:3000';
}
