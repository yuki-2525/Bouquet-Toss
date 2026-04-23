"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flower, TrendingUp, ArrowLeft, Plus, Users, Loader2 } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";
import { LoadingScreen } from "@/frontend/components/LoadingScreen";
import { motion } from "framer-motion";

interface Character {
  id: string;
  name: string;
  avatarUrl: string | null;
  ownerId: string;
  stellaBattleBouquets: number;
}

interface RoomData {
  id: string;
  name: string;
  characters: Character[];
  stella_battle_active: boolean;
}

export default function StellaBattlePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const characterId = params?.characterId as string;
  const { user } = useUser();
  const currentUserId = user?.id;

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [plusValue, setPlusValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastAction, setLastAction] = useState<'none' | 'plus' | 'minus'>('none');

  useEffect(() => {
    if (!currentUserId || !roomId || !characterId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}?userId=${currentUserId}`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        
        if (!data.stellaBattleActive) {
          router.push(`/rooms/${roomId}`);
          return;
        }

        const char = data.characters.find((c: any) => c.id === characterId);
        if (!char) throw new Error("キャラクターが見つかりません");
        if (char.ownerId !== currentUserId) {
          router.push(`/rooms/${roomId}`);
          return;
        }

        setRoomData(data);
        setCharacter(char);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // SSEによるリアルタイム更新
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        if (type === 'STELLA_BATTLE_UPDATE') {
          if (data.id === characterId) {
            setIsUpdating(false);
          }
          setRoomData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              characters: prev.characters.map(c => 
                c.id === data.id ? { ...c, stellaBattleBouquets: data.stella_battle_bouquets } : c
              )
            };
          });
          if (data.id === characterId) {
            setCharacter(prev => prev ? { ...prev, stellaBattleBouquets: data.stella_battle_bouquets } : prev);
          }
        } else if (type === 'STELLA_BATTLE_END') {
          router.push(`/rooms/${roomId}`);
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => eventSource.close();
  }, [roomId, characterId, currentUserId, router]);

  const handleUpdateBouquets = async (amount: number) => {
    // 減少時は楽観的UI更新とロック
    if (amount < 0) {
      setIsUpdating(true);
      setLastAction('minus');
      setCharacter(prev => prev ? { ...prev, stellaBattleBouquets: Math.max(0, prev.stellaBattleBouquets + amount) } : prev);
    } else {
      setLastAction('plus');
    }

    try {
      const res = await fetch(`/api/rooms/${roomId}/stella-battle/bouquets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, amount }),
      });
      if (!res.ok) {
        // 失敗時は再取得して整合性を取る
        setIsUpdating(false);
        throw new Error('更新に失敗しました');
      }
    } catch (err) {
      console.error(err);
      // ロールバック的な処理が必要な場合はここでfetchDataを呼ぶなどの対応
    }
  };

  if (isLoading) return <LoadingScreen message="Loading Stella Battle..." />;
  if (error || !character || !roomData) return <div className="p-8 text-center text-rose-500">{error || "アクセスできません"}</div>;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push(`/rooms/${roomId}`)}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ルームへ戻る</span>
          </button>
          <div className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-500/20">
            <TrendingUp className="w-3 h-3" />
            STELLA BATTLE ACTIVE
          </div>
        </div>

        {/* 自キャラメイン表示 */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
          <div className="p-8 bg-rose-500 text-white flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md overflow-hidden border-2 border-white/30 shadow-lg shrink-0">
              {character.avatarUrl ? (
                <img src={character.avatarUrl.split(",")[0]} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Flower className="w-10 h-10 text-white/40" /></div>
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Participating as</p>
              <h1 className="text-4xl font-black font-serif">{character.name}</h1>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* カウント表示 */}
            <div className="text-center space-y-2">
              <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">現在のステラブーケ数</p>
              <motion.div 
                key={character.stellaBattleBouquets}
                initial={lastAction === 'minus' ? { scale: 1.2, color: '#ef4444' } : { scale: 1.1, color: '#10b981' }}
                animate={{ scale: 1, color: '#f43f5e' }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-8xl font-black font-serif tabular-nums tracking-tighter"
              >
                {character.stellaBattleBouquets?.toLocaleString() || 0}
              </motion.div>
            </div>

            {/* 操作ツールボックス */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] p-6 space-y-6 border border-zinc-100 dark:border-zinc-800 shadow-inner">
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Multiplier</p>
                <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                  {[1, 2, 3, 4, 5].map(m => (
                    <button
                      key={m}
                      onClick={() => setMultiplier(m)}
                      disabled={isUpdating}
                      className={`w-12 h-12 rounded-xl text-lg font-black transition-all ${multiplier === m ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'} disabled:opacity-50`}
                    >
                      x{m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[3, 4, 5].map(val => (
                  <button
                    key={val}
                    onClick={() => handleUpdateBouquets(-(val * multiplier))}
                    disabled={isUpdating}
                    className="group relative overflow-hidden py-6 rounded-2xl bg-zinc-800 text-white font-black hover:bg-zinc-700 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 text-2xl">-{val * multiplier}</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isUpdating && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={plusValue}
                    onChange={(e) => setPlusValue(e.target.value)}
                    disabled={isUpdating}
                    placeholder="数値を入力して増やす"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-bold text-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all disabled:opacity-50"
                  />
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                </div>
                <button
                  onClick={() => {
                    const val = parseInt(plusValue);
                    if (!isNaN(val) && val > 0) {
                      handleUpdateBouquets(val);
                      setPlusValue("");
                    }
                  }}
                  disabled={isUpdating}
                  className="px-8 py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  追加
                </button>
              </div>
            </div>

            {/* 全キャラ状況リスト */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" /> 全キャラクターの状況
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {roomData.characters.map(c => (
                  <div key={c.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${c.id === characterId ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl.split(",")[0]} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Flower className="w-4 h-4 text-zinc-300" /></div>
                        )}
                      </div>
                      <span className={`font-bold ${c.id === characterId ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-600 dark:text-zinc-300'}`}>{c.name}</span>
                    </div>
                    <span className={`text-xl font-black font-serif tabular-nums ${c.id === characterId ? 'text-rose-500' : 'text-zinc-400'}`}>
                      {c.stellaBattleBouquets?.toLocaleString() || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
