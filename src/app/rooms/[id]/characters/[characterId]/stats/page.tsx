"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Flower, ArrowLeft, TrendingUp, ShieldAlert, Heart, Trophy, Loader2, Edit3, Check, X } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";
import { AnimatedCounter } from "@/frontend/components/AnimatedCounter";
import { BouquetRain } from "@/frontend/components/BouquetRain";
import { LoadingScreen } from "@/frontend/components/LoadingScreen";

interface CharacterStats {
  id: string;
  name: string;
  avatarUrl: string | null;
  totalBouquets: number | null;
  mySentCount: number;
  ownerId: string;
}

interface BreakdownItem {
  name: string;
  avatarUrl: string | null;
  count: number;
}

interface ShareableUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  hasAccess: boolean;
  isFixed?: boolean;
  isRoomOwner?: boolean;
}

export default function CharacterStatsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  
  const roomId = params?.id as string;
  const characterId = params?.characterId as string;

  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [shareableUsers, setShareableUsers] = useState<ShareableUser[]>([]);
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState<string | null>(null);
  const [triggerCount, setTriggerCount] = useState(0);
  
  // 画像編集用ステート
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [newAvatarUrls, setNewAvatarUrls] = useState<[string, string]>(["", ""]);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  useEffect(() => {
    if (!user || !roomId || !characterId) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}?userId=${user.id}`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        
        const data = await res.json();
        if (data.stellaBattleActive) {
          router.push(`/rooms/${roomId}`);
          return;
        }
        setRoomName(data.name);
        
        const char = data.characters.find((c: any) => c.id === characterId);
        if (!char) throw new Error("キャラクターが見つかりません");
        
        if (char.totalBouquets === null) {
          setError("このキャラクターの統計を見る権限がありません。");
        } else {
          setStats(char);
          // カンマ区切りのURLを分割してセット
          const urls = (char.avatarUrl || "").split(",").map((u: string) => u.trim());
          setNewAvatarUrls([urls[0] || "", urls[1] || ""]);
          
          // 内訳データの取得
          const breakdownRes = await fetch(`/api/rooms/${roomId}/characters/${characterId}/stats?userId=${user.id}`);
          if (breakdownRes.ok) {
            const bData = await breakdownRes.json();
            setBreakdown(bData.breakdown);
          }

          // 共有可能なユーザー一覧の取得（自分がオーナーの場合のみ）
          if (char.ownerId === user.id) {
            const usersRes = await fetch(`/api/rooms/${roomId}/characters/${characterId}/access?userId=${user.id}`);
            if (usersRes.ok) {
              const uData = await usersRes.json();
              setShareableUsers(uData);
            }
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // 3. リアルタイム更新（SSE）の開始
    console.log("Connecting to SSE:", `/api/rooms/${roomId}/events`);
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("SSE Received:", payload);
        
        const { type, data } = payload;
        
        if (type === 'CHARACTER_UPDATE' && data.id === characterId) {
          console.log("Updating stats for:", characterId, "New count:", data.total_bouquets_received);
          // 総数を更新
          setStats(prev => prev ? { ...prev, totalBouquets: data.total_bouquets_received } : prev);
          // 演出をトリガー
          setTriggerCount(prev => prev + 1);
          
          // 内訳も再取得
          fetch(`/api/rooms/${roomId}/characters/${characterId}/stats?userId=${user.id}`)
            .then(res => res.json())
            .then(bData => {
              if (bData.breakdown) setBreakdown(bData.breakdown);
            })
            .catch(err => console.error("Failed to refresh breakdown:", err));
        } else if (type === 'STELLA_BATTLE_START') {
          router.push(`/rooms/${roomId}`);
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE EventSource error:", err);
    };

    return () => {
      console.log("Closing SSE connection");
      eventSource.close();
    };
  }, [roomId, characterId, user]);

  const handleUpdateAvatar = async () => {
    if (!user || !stats) return;
    setIsUpdatingAvatar(true);

    try {
      // 空文字を除外してカンマで結合
      const combinedUrl = newAvatarUrls.filter(u => u.trim()).join(",");
      
      const res = await fetch(`/api/rooms/${roomId}/characters/${characterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: combinedUrl }),
      });

      if (!res.ok) throw new Error("画像の更新に失敗しました");

      const updated = await res.json();
      setStats(prev => prev ? { ...prev, avatarUrl: updated.avatar_url } : prev);
      setIsEditingAvatar(false);
    } catch (err) {
      alert("エラーが発生しました");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const toggleAccess = async (targetUserId: string, currentHasAccess: boolean) => {
    if (!user) return;
    const target = shareableUsers.find(u => u.id === targetUserId);
    if (target?.isFixed) return;
    
    setIsUpdatingAccess(targetUserId);

    try {
      const res = await fetch(`/api/rooms/${roomId}/characters/${characterId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          targetUserId,
          hasAccess: !currentHasAccess
        }),
      });

      if (!res.ok) throw new Error("設定の変更に失敗しました");

      setShareableUsers(prev => prev.map(u => 
        u.id === targetUserId ? { ...u, hasAccess: !currentHasAccess } : u
      ));
    } catch (err) {
      alert("エラーが発生しました");
    } finally {
      setIsUpdatingAccess(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">閲覧制限</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
        <Link href={`/rooms/${roomId}`} className="text-rose-500 font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> ルームへ戻る
        </Link>
      </main>
    );
  }

  return (
    <>
      <BouquetRain 
        triggerCount={triggerCount} 
        initialCount={stats?.totalBouquets || 0}
      />
      <main className="container mx-auto px-4 py-12 max-w-2xl relative z-10">
        <Link href={`/rooms/${roomId}`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {roomName} に戻る
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl font-black font-serif mb-8 text-zinc-800 dark:text-zinc-100">{stats?.name}</h1>

            {/* 画像エリア */}
            <div className="relative group w-full mb-8">
              <div className={`grid gap-4 ${
                (stats?.avatarUrl?.split(",")?.filter(u => u.trim())?.length || 0) > 1 
                  ? "grid-cols-2" 
                  : "grid-cols-1 max-w-sm mx-auto"
              }`}>
                {(stats?.avatarUrl?.split(",")?.filter(u => u.trim()) || []).length > 0 ? (
                  stats?.avatarUrl?.split(",")?.filter(u => u.trim()).map((url, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-zinc-50 dark:bg-zinc-800 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-inner">
                      <img src={url} alt={`${stats.name} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    </div>
                  ))
                ) : (
                  <div className="aspect-square rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-rose-200 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-inner max-w-sm mx-auto w-full">
                    <Flower className="w-24 h-24 opacity-20" />
                  </div>
                )}
              </div>
              
              {/* 画像編集ボタン（オーナーのみ） */}
              {stats?.ownerId === user?.id && !isEditingAvatar && (
                <button 
                  onClick={() => setIsEditingAvatar(true)}
                  className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 z-20"
                  title="画像を編集"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 画像編集入力欄 (2枚分) */}
            {isEditingAvatar && (
              <div className="w-full max-w-sm flex flex-col gap-3 mb-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2">
                  {[0, 1].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={newAvatarUrls[idx]}
                      onChange={(e) => {
                        const next = [...newAvatarUrls] as [string, string];
                        next[idx] = e.target.value;
                        setNewAvatarUrls(next);
                      }}
                      placeholder={`画像URL ${idx + 1} を入力 (https://...)`}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-inner"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateAvatar}
                    disabled={isUpdatingAvatar}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-md shadow-rose-500/20 font-bold flex items-center justify-center gap-2"
                  >
                    {isUpdatingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    保存する
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingAvatar(false);
                      const urls = (stats?.avatarUrl || "").split(",").map(u => u.trim());
                      setNewAvatarUrls([urls[0] || "", urls[1] || ""]);
                    }}
                    className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center mb-10">
            {/* 総獲得数カード */}
            <div className="w-full bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-10 text-white shadow-xl shadow-rose-500/30 text-center transform transition-transform hover:scale-[1.01]">
              <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
                <Trophy className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest">贈られたブーケの総数</span>
              </div>
              <div className="text-7xl font-black tracking-tighter">
                <AnimatedCounter value={stats?.totalBouquets || 0} />
              </div>
            </div>
          </div>
          <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-10" />

          {/* 誰からもらったかの内訳 */}
          <div className="mb-12 text-left">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <Heart className="w-5 h-5 text-rose-500" />
              贈ってくれた人々
            </h2>
            <div className="space-y-3">
              {breakdown.length > 0 ? (
                breakdown.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center shadow-inner">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-zinc-400 font-bold">{item.name[0]}</span>
                        )}
                      </div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                    </div>
                    <div className="text-2xl font-black text-rose-500">
                      <AnimatedCounter value={item.count} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-12 text-zinc-400 text-sm italic bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 w-full">
                  まだブーケは届いていないようです...
                </p>
              )}
            </div>
          </div>

          {/* 共有設定（オーナーのみ） */}
          {stats?.ownerId === user?.id && (
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 text-left">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                閲覧許可設定
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                このキャラクターの統計データを閲覧できるユーザーを選択できます。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shareableUsers.length > 0 ? (
                  shareableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggleAccess(u.id, u.hasAccess)}
                      disabled={isUpdatingAccess === u.id || u.isFixed}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        u.hasAccess 
                          ? "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 shadow-sm" 
                          : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center text-[10px]">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name[0]
                          )}
                        </div>
                        <span className="text-sm font-bold truncate max-w-[120px]">{u.name}</span>
                        {u.isRoomOwner && <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-wider">Room Owner</span>}
                      </div>
                      {isUpdatingAccess === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${u.hasAccess ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-700"} ${u.isFixed ? "opacity-50 cursor-not-allowed" : ""}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${u.hasAccess ? "left-5" : "left-1"}`} />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-center py-4 text-xs text-zinc-400 italic">ルーム内に他のユーザーがいません</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
