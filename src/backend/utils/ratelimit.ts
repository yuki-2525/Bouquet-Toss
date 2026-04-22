/**
 * インメモリー型の簡易的なレートリミッター
 * Vercel Serverless Functions 等ではインスタンスが破棄されるとリセットされますが、
 * 短時間での突発的な連打（DoS・ブルートフォース）の緩和には有効です。
 * 
 * 本格的な分散システムには @upstash/ratelimit と Redis を推奨します。
 */

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimiter = new Map<string, RateLimitInfo>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  // メモリリーク対策: Mapが大きくなりすぎたら期限切れエントリを掃除する
  if (rateLimiter.size > 10000) {
    for (const [k, v] of rateLimiter.entries()) {
      if (now > v.resetTime) {
        rateLimiter.delete(k);
      }
    }
  }

  const info = rateLimiter.get(key);

  if (!info) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  // ウィンドウが過ぎていたらリセット
  if (now > info.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  // 制限超過
  if (info.count >= maxRequests) {
    return false;
  }

  // カウントアップ
  info.count += 1;
  return true;
}
