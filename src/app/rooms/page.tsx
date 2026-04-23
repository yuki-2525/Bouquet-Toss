"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flower, Plus, Lock, ArrowRight, Loader2,
  LayoutGrid, History, Settings, LogIn, ExternalLink, Hash
} from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { LoadingScreen } from "@/frontend/components/LoadingScreen";

interface Room {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export default function RoomsDashboard() {
  const router = useRouter();
  const { user, isLoading: isUserLoading, signOut } = useUser();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [allowOwnerManageAll, setAllowOwnerManageAll] = useState(false);
  const [allowOwnerViewStats, setAllowOwnerViewStats] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // IDで参加用
  const [joinId, setJoinId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(`/api/rooms?userId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch rooms");
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPassword || !user) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          password: newPassword,
          userId: user.id,
          allowOwnerManageAll,
          allowOwnerViewStats
        }),
      });
      if (!res.ok) throw new Error("作成に失敗しました");
      const room = await res.json();
      router.push(`/rooms/${room.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId || !joinPassword || !user) return;

    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/rooms/${joinId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: joinPassword, userId: user.id }),
      });
      if (!res.ok) throw new Error("IDまたはパスワードが正しくありません");
      router.push(`/rooms/${joinId}`);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLogout = async () => {
    const message = user?.isGuest 
      ? "ゲストアカウントからログアウトすると、二度とこのアカウントでログインできなくなります。よろしいですか？"
      : "ログアウトしますか？";
      
    if (confirm(message)) {
      await signOut();
    }
  };

  if (isUserLoading) return <LoadingScreen message="Checking Sessions" />;
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-12 min-h-screen">
      <header className="mb-12">
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3 mb-2">
          <LayoutGrid className="w-8 h-8 text-rose-500" />
          ルーム管理
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          作成したルームや参加中のセッションを管理します
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側: アクションパネル */}
        <div className="lg:col-span-1 space-y-6">
          {/* ルーム作成 */}
          <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-rose-500" />
              新規ルーム作成
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                placeholder="ルーム名"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              <input
                type="password"
                placeholder="入室パスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />

              <div className="space-y-3 px-1 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={allowOwnerManageAll}
                      onChange={(e) => setAllowOwnerManageAll(e.target.checked)}
                      className="w-5 h-5 rounded-md border-zinc-300 dark:border-zinc-700 text-rose-500 focus:ring-rose-500 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-rose-500 transition-colors">
                      部屋主に全キャラの管理権限を付与
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      部屋主が他人のキャラの名前変更や削除を行えるようになります
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={allowOwnerViewStats}
                      onChange={(e) => setAllowOwnerViewStats(e.target.checked)}
                      className="w-5 h-5 rounded-md border-zinc-300 dark:border-zinc-700 text-rose-500 focus:ring-rose-500 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-rose-500 transition-colors">
                      部屋主に全キャラの統計閲覧を許可
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      部屋主が常に全キャラのブーケ数の統計を確認できるようになります
                    </span>
                  </div>
                </label>
              </div>

              <button
                disabled={isCreating}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "作成する"}
              </button>
            </form>
          </section>

          {/* IDで入室 */}
          <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-zinc-400" />
              IDで入室する
            </h2>
            <form onSubmit={handleJoinById} className="space-y-4">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="ルームID (UUID)"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  placeholder="パスワード"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-sm"
                />
              </div>
              {joinError && <p className="text-rose-500 text-xs">{joinError}</p>}
              <button
                disabled={isJoining}
                className="w-full py-3 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : "入室する"}
              </button>
            </form>
          </section>
        </div>

        {/* 右側: ルーム一覧 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[500px]">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <History className="w-6 h-6 text-rose-500" />
              最近のルーム
            </h2>

            {isRoomsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="group p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-rose-400 dark:hover:border-rose-500/50 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg group-hover:text-rose-500 transition-colors line-clamp-1">
                        {room.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-zinc-400 space-y-1">
                      <p>ID: {room.id.slice(0, 8)}...</p>
                      <p>{new Date(room.created_at).toLocaleDateString()} に作成</p>
                      {room.created_by === user.id && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold">
                          Owner
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <Flower className="w-10 h-10 text-zinc-300" />
                </div>
                <p className="text-zinc-500">まだルームがありません。<br />新しく作成して始めましょう！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
