"use client";

import Link from "next/link";
import { Flower, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { GitHubIcon } from "./icons/SocialIcons";

export function Footer() {
  const pathname = usePathname();
  
  // オーバーレイページではフッターを表示しない
  if (pathname?.includes("/overlay")) {
    return null;
  }

  return (
    <footer className="w-full py-12 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2 text-rose-500">
            <Flower className="w-6 h-6" />
            <span className="text-xl font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-100">Bouquet-Toss</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ブーケを投げて応援の気持ちを形にするwebアプリ
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-6">
          <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/about" className="hover:text-rose-500 transition-colors">このアプリについて</Link>
            <Link href="/terms" className="hover:text-rose-500 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-rose-500 transition-colors">プライバシーポリシー</Link>
          </nav>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs text-zinc-400">
              © 2026 Bouquet-Toss - Developed by sakurayuki
            </p>
            <div className="flex gap-4 text-[10px] text-zinc-400/60">
              <a href="https://x.com/sakurayuki_dev" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                <span>@sakurayuki_dev</span>
              </a>
              <a href="https://github.com/yuki-2525/Bouquet-Toss" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 flex items-center gap-1">
                <GitHubIcon className="w-3 h-3" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
