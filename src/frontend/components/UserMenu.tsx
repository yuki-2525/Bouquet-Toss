"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, LogIn, ChevronDown, User, LayoutDashboard, Pencil, Check, X } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";

export function UserMenu() {
  const { user, setUser, isLoading, signOut, refreshUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // クイック編集用ステート
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempName(user?.displayName || "");
    setIsEditing(true);
  };

  const handleSaveName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tempName.trim() || tempName === user?.displayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: tempName.trim() }),
      });

      if (res.ok) {
        // DBから最新情報を再取得してステートを更新
        await refreshUser();
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update name", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-9 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm shadow-rose-500/30"
      >
        <LogIn className="w-4 h-4" />
        ログイン
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-rose-400 transition-colors"
      >
        {/* アバター */}
        <div className="w-7 h-7 rounded-full overflow-hidden bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-rose-500" />
          )}
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 max-w-[100px] truncate">
          {user.displayName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-zinc-900/50 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">ユーザー設定</p>
            
            {isEditing ? (
              <div className="flex items-center gap-1 mt-1">
                <input 
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-zinc-900 border border-rose-500 rounded outline-none focus:ring-1 focus:ring-rose-500"
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={isSaving} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group/name">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate pr-2">
                  {user.displayName}
                </p>
                <button 
                  onClick={handleStartEdit}
                  className="p-1 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                  title="名前を変更"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-[10px] text-zinc-400 mt-1 italic">
              {user.isGuest ? "ゲストとして参加中" : "SNSアカウント連携済み"}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/rooms"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-zinc-400" />
              ルーム一覧
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <User className="w-4 h-4 text-zinc-400" />
              マイページ
            </Link>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
            <button
              onClick={async () => {
                setIsOpen(false);
                if (user?.isGuest) {
                  if (confirm("ゲストアカウントからログアウトすると、二度とこのアカウントでログインできなくなります。よろしいですか？")) {
                    await signOut();
                  }
                } else {
                  if (confirm("ログアウトしますか？")) {
                    await signOut();
                  }
                }
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
