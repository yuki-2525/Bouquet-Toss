"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Flower, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";

function UnlockContent() {
  const { id: roomId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, userId: user.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "パスワードが正しくありません");
      }

      // 成功したら元のルームへ
      router.push(`/rooms/${roomId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6 mx-auto">
          <Lock className="w-8 h-8 text-rose-500" />
        </div>
        
        <h1 className="text-2xl font-bold font-serif mb-2 text-zinc-900 dark:text-zinc-100">パスワードが必要です</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          このルームは保護されています。<br />入室用のパスワードを入力してください。
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center text-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="flex items-center justify-center gap-2 w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? "確認中..." : "入室する"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-500">
          一度認証すると、同じアカウントからは<br />次回以降パスワードなしで入室できます。
        </p>
      </div>
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense>
      <UnlockContent />
    </Suspense>
  );
}
