"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Flower, LogOut, Check, Pencil, ArrowLeft, ShieldCheck, UserCircle } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";
import Link from "next/link";

interface MyCharacter {
  id: string;
  name: string;
  avatar_url: string | null;
  total_bouquets_received: number;
  rooms: {
    id: string;
    name: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, signOut } = useUser();

  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const [isLoadingChars, setIsLoadingChars] = useState(true);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      fetchMyCharacters();
    }
  }, [user]);

  const fetchMyCharacters = async () => {
    try {
      const res = await fetch("/api/user/characters");
      if (res.ok) {
        const data = await res.json();
        setMyCharacters(data);
      }
    } catch (err) {
      console.error("Failed to fetch characters:", err);
    } finally {
      setIsLoadingChars(false);
    }
  };

  const handleUpdateName = async () => {
    if (!displayName.trim() || displayName === user?.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (res.ok) {
        setUser(prev => prev ? { ...prev, displayName: displayName.trim() } : null);
        setIsEditingName(false);
      } else {
        alert("名前の更新に失敗しました");
      }
    } catch (err) {
      alert("エラーが発生しました");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut();
      // AuthContext.signOut 内でトップへ遷移するように設定済み
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/rooms" className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードへ戻る
        </Link>

        {/* プロフィールカード */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-12 h-12" />
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-2xl font-bold bg-zinc-50 dark:bg-zinc-800 border-b-2 border-rose-500 outline-none px-2 py-1 rounded-t-md"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdating}
                      className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{user.displayName}</h1>
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{user.isGuest ? "ゲストユーザー" : "ソーシャルログイン済み"}</span>
                </div>
                <div className="text-zinc-300">|</div>
                <div className="font-mono text-xs">{user.id.slice(0, 8)}...</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-all flex items-center gap-2 font-bold"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </section>

        {/* 自分の騎士たち */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 px-2">
            <Flower className="w-5 h-5 text-rose-500" />
            あなたが作成した騎士
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoadingChars ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
              ))
            ) : myCharacters.length > 0 ? (
              myCharacters.map((char) => (
                <Link
                  key={char.id}
                  href={`/rooms/${char.rooms.id}/characters/${char.id}/stats`}
                  className="group flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-900 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-20 h-14 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 group-hover:text-rose-500 transition-colors border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    {char.avatar_url ? (
                      <div className={`grid w-full h-full ${char.avatar_url.split(",").filter(u => u.trim()).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {char.avatar_url.split(",").filter(u => u.trim()).map((url, i) => (
                          <img key={i} src={url} alt={`${char.name} ${i + 1}`} className="w-full h-full object-cover" />
                        ))}
                      </div>
                    ) : (
                      <Flower className="w-6 h-6 opacity-40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-rose-500 transition-colors truncate">
                      {char.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 truncate">
                      in {char.rooms.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-rose-500 leading-none mb-1">
                      {char.total_bouquets_received}
                    </div>
                    <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-tighter">Bouquets</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400">まだ騎士を作成していません</p>
                <Link href="/rooms" className="text-rose-500 text-sm font-bold mt-2 inline-block hover:underline">
                  ルームに参加して騎士を作成しよう
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
