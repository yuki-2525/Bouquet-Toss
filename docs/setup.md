# 環境構築・セットアップ手順 (Setup)

本アプリケーションをローカルで起動し、開発・デプロイするための手順です。

## 1. 動作要件
- Node.js (v18以降推奨)
- npm, yarn, pnpm いずれかのパッケージマネージャー
- Supabase アカウント

## 2. データベース (Supabase) の準備

1. [Supabase](https://supabase.com/) にログインし、新しいプロジェクトを作成します。
# セットアップガイド (Setup)

## 1. Supabase の準備

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクトを作成。
2. **SQL Editor** を開き、リポジトリ内の `src/backend/db/schema.sql` を実行してテーブルと関数を作成。
3. **Authentication** > **Providers** で、使用したい認証方法（Email, Google等）を有効化。

## 2. 環境変数の設定

プロジェクト直下に `.env.local` ファイルを作成し、以下の値を設定してください。

```env
# Supabase 設定
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# アプリ設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. 起動

```bash
# パッケージのインストール
npm install

# ローカル開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、画面が表示されれば準備完了です。

## 5. Vercel へのデプロイ

本プロジェクトは Vercel に最適化されています。

1. [Vercel](https://vercel.com/) にログインし、「Add New Project」を選択。
2. 本リポジトリ (GitHub等) をインポートします。
3. **Environment Variables** (環境変数) の設定画面で、`.env.local` に記載した内容と同じキーと値を設定します。
4. 「Deploy」をクリックすると、フロントエンドとバックエンド(API)が自動的にビルド・デプロイされます。
