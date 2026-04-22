"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flower, Plus, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password || !user) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, userId: user.id }),
      });

      if (!res.ok) throw new Error("ルームの作成に失敗しました");
      
      const room = await res.json();
      router.push(`/rooms/${room.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsCreating(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-12">
        <Flower className="h-20 w-20 text-rose-500 mx-auto mb-6" />
        <h1 className="text-5xl font-bold font-serif mb-4 text-zinc-900 dark:text-zinc-100">Bouquet-Toss</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          ブーケを投げるwebアプリ
        </p>
      </div>

      {!isUserLoading && user ? (
        <div className="flex flex-col items-center gap-6">
          <p className="text-zinc-500">ログイン中: {user.displayName}</p>
          <Link
            href="/rooms"
            className="px-10 py-5 bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-90 text-white rounded-full font-bold transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
          >
            ルーム管理ダッシュボードへ
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="h-1 bg-zinc-200 dark:bg-zinc-800 w-24 rounded-full" />
          <p className="text-zinc-500">
            {isUserLoading ? "読み込み中..." : "ルームを作成するにはログインが必要です"}
          </p>
          {!isUserLoading && !user && (
            <button
              onClick={() => router.push("/login")}
              className="px-10 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold hover:scale-105 transition-all shadow-lg"
            >
              ログインして始める
            </button>
          )}
        </div>
      )}

      <div className="mt-16 text-zinc-400 text-xs flex flex-col items-center gap-4">
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-rose-500 transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-rose-500 transition-colors">プライバシーポリシー</Link>
        </div>
        <p>© 2026 Bouquet-Toss - Developed for sakurayuki</p>
      </div>
    </main>
  );
}
