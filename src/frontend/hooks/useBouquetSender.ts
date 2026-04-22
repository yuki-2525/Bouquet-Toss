import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ブーケ投下の状態管理とバッチ送信を行うカスタムフック
 * @param roomId ルームのUUID
 * @param characterId キャラクターのUUID
 * @param userId ユーザー(またはゲスト)のUUID
 * @param initialCount 初期表示する、自分が送ったブーケの数
 */
export function useBouquetSender(roomId: string, characterId: string, userId: string, initialCount: number = 0) {
  const [localCount, setLocalCount] = useState(initialCount);
  const [isSending, setIsSending] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // サーバーからの初期データロード時に、最新のカウントを反映させる
  useEffect(() => {
    setLocalCount(initialCount);
  }, [initialCount]);
  
  const pendingCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sendBatch = useCallback(async () => {
    const countToSend = pendingCountRef.current;
    if (countToSend === 0) {
      setIsSending(false);
      return;
    }

    // バッファをリセット
    pendingCountRef.current = 0;
    setIsSending(true);

    try {
      const res = await fetch('/api/bouquets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          characterId,
          count: countToSend
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send bouquets to server');
      }
    } catch (error) {
      console.error("Batch send error:", error);
      // ネットワークエラー等で失敗した場合はバッファに戻す
      pendingCountRef.current += countToSend;
    } finally {
      setIsSending(false);
    }
  }, [roomId, characterId, userId]);

  const handleThrow = useCallback((amount: number = 1) => {
    if (isLocked) return;

    // 楽観的UI更新：即座に表示を更新（0未満にはしない）
    setLocalCount(prev => Math.max(0, prev + amount));

    // 送信待ちバッファを更新
    pendingCountRef.current += amount;

    // 前のタイマーをキャンセル
    if (timerRef.current) clearTimeout(timerRef.current);

    // 5000以上の場合は即座に送信し、0.5秒間ロックする
    if (Math.abs(amount) >= 5000) {
      sendBatch();
      setIsLocked(true);
      setTimeout(() => setIsLocked(false), 500);
    } else {
      // それ以外は2秒間操作がなければAPIに送信する(Debounce)
      timerRef.current = setTimeout(sendBatch, 2000);
    }
  }, [sendBatch, isLocked]);

  // コンポーネントアンマウント時に残りのバッファがあれば送信
  useEffect(() => {
    return () => {
      if (pendingCountRef.current > 0) {
        sendBatch();
      }
    };
  }, [sendBatch]);

  return { localCount, handleThrow, isSending, isLocked };
}
