"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          トップへ戻る
        </Link>

        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-rose-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">利用規約</h1>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400">
            <p>
              この利用規約（以下、「本規約」といいます。）は、Bouquet-Toss（以下、「本サービス」といいます。）の利用条件を定めるものです。利用者の皆さまには、本規約に従って本サービスをご利用いただきます。
            </p>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">1. 利用の制限</h2>
              <p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>他の利用者に対する嫌がらせや誹謗中傷</li>
                <li>不適切な画像URLの設定や公序良俗に反するテキストの入力</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">2. 免責事項</h2>
              <p>
                本サービスは「現状のまま」提供され、その正確性、安全性、有用性を保証するものではありません。本サービスの利用によって生じた損害（データの消失、TRPGセッションの遅延等を含む）について、運営者は一切の責任を負いません。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">3. サービス内容の変更</h2>
              <p>
                本サービスは、事前の通知なく内容の変更、停止、または終了することがあります。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">4. 準拠法</h2>
              <p>
                本規約の解釈にあたっては、日本法を準拠法とします。
              </p>
            </div>

            <div className="pt-8 text-sm border-t border-zinc-100 dark:border-zinc-800">
              <p>2026年4月23日 制定</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
