"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          トップへ戻る
        </Link>

        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-8 h-8 text-rose-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">プライバシーポリシー</h1>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400">
            <p>
              Bouquet-Toss（以下、「本サービス」といいます。）は、利用者の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
            </p>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">1. 取得する情報</h2>
              <p>本サービスでは、以下の情報を取得・保持します。</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>ユーザー名（表示用）</li>
                <li>アバター画像のURL</li>
                <li>本サービス内での活動ログ（ブーケの投下数、日時等）</li>
                <li>認証に使用した外部サービス（Google等）の識別子（ログイン利用者のみ）</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">2. 利用目的</h2>
              <p>取得した情報は、以下の目的で利用します。</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>本サービスの提供・運営（リアルタイム同期、統計表示等）</li>
                <li>不具合の修正やサービスの改善</li>
                <li>不正利用の防止</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">3. 第三者提供</h2>
              <p>
                本サービスは、法令に基づく場合を除き、利用者の同意を得ることなく個人情報を第三者に提供することはありません。ただし、本サービスのインフラとして Supabase および Vercel を利用しており、データはこれらのプラットフォーム上に保存されます。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">4. Cookieの利用</h2>
              <p>
                本サービスは、ユーザーの利便性向上およびセッション維持のため、Cookieおよびブラウザのローカルストレージを利用することがあります。
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
