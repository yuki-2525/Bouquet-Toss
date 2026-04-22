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

  // サーバーからの初期データロード時に、最新のカウントを反映させる
  useEffect(() => {
    setLocalCount(initialCount);
  }, [initialCount]);
  
  const pendingCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sendBatch = useCallback(async () => {
    const countToSend = pendingCountRef.current;
    if (countToSend === 0) return;

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
    // 楽観的UI更新：即座に表示を更新（0未満にはしない）
    setLocalCount(prev => Math.max(0, prev + amount));

    // 送信待ちバッファを更新
    // ※Strict Modeで2回実行されるのを防ぐため、setStateの外で行う
    pendingCountRef.current += amount;

    // 前のタイマーをキャンセルし、2秒間操作がなければAPIに送信する(Debounce)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(sendBatch, 2000);
  }, [sendBatch]);

  // コンポーネントアンマウント時に残りのバッファがあれば送信
  useEffect(() => {
    return () => {
      if (pendingCountRef.current > 0) {
        sendBatch();
      }
    };
  }, [sendBatch]);

  return { localCount, handleThrow, isSending };
}
