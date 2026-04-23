"use client";

import Link from "next/link";
import { Flower, X, ArrowLeft, Heart, Code, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GitHubIcon } from "@/frontend/components/icons/SocialIcons";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center py-16 px-6">
      {/* 戻るボタン */}
      <div className="max-w-4xl w-full mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>トップに戻る</span>
        </Link>
      </div>

      <div className="max-w-4xl w-full space-y-16">
        {/* ヒーローセクション */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 mb-4"
          >
            <Flower className="w-10 h-10" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-serif font-black tracking-tight"
          >
            About Bouquet-Toss
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed"
          >
            Bouquet-Tossは、推しのキャラクターや配信者に「ブーケ」を投げて応援の気持ちを形にするためのwebアプリです。
          </motion.p>
        </section>

        {/* 特徴セクション */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { icon: Sparkles, title: "リアルタイム", desc: "投げたブーケは即座に反映され、みんなで盛り上がれます。" },
            { icon: Heart, title: "応援を形に", desc: "累計数だけでなく、個人がどれだけ贈ったかも記録されます。" },
            { icon: Code, title: "配信対応", desc: "OBS用オーバーレイ機能で、配信画面にリアルタイムな統計を表示可能。" },
            { icon: Flower, title: "誰でも手軽に", desc: "ルームを作成するだけで、すぐにブーケ投げを開始できます。" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-rose-500/30 transition-colors"
            >
              <item.icon className="w-6 h-6 text-rose-500 mb-3" />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* 開発者セクション */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-center gap-8 bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg">
              SY
            </div>
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">sakurayuki</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Developer / Designer</p>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                「好き」をより楽しく、より美しく形にするためのツールを開発しています。
              </p>
              <div className="flex justify-center sm:justify-start gap-4">
                <a
                  href="https://x.com/sakurayuki_dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm font-bold hover:text-rose-500 transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                  <span>@sakurayuki_dev</span>
                </a>
                <a
                  href="https://github.com/yuki-2525/Bouquet-Toss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm font-bold hover:text-rose-500 transition-all shadow-sm"
                >
                  <GitHubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
