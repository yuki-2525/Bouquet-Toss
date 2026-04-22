"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flower, Loader2 } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/rooms";
  const { refreshUser } = useUser();

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 既に名前が登録されているかチェック
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        
        if (!data.user) {
          router.push("/login");
          return;
        }

        if (!data.user.needsRegistration) {
          // すでに登録済みならスキップ
          router.push(redirect);
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        router.push("/login");
      }
    };
    checkUser();
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });

      if (!res.ok) throw new Error("保存に失敗しました");

      // コンテキストのセッションを更新
      await refreshUser();
      router.push(redirect);
    } catch (err: any) {
      console.error(err);
      setError("名前の登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <Flower className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100">Welcome!</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            アプリで表示されるあなたの名前を<br />教えてください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2 ml-1">表示名</label>
            <input
              type="text"
              placeholder="例: 花咲タロウ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
              autoFocus
              required
            />
          </div>
          
          {error && (
            <p className="text-xs text-rose-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full px-4 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "はじめる"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
