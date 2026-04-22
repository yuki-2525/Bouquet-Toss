"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Hydrationミスマッチを防ぐため、マウント後に描画する
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // マウント前はプレースホルダー用の空divを返す（レイアウトシフト防止）
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm border border-zinc-200 dark:border-zinc-700"
      aria-label="Toggle theme"
      title="ライト/ダークモード切替"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
