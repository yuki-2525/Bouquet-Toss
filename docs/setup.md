# 環境構築・セットアップ手順 (Setup)

本アプリケーションをローカルで起動し、開発・デプロイするための手順です。

## 1. 動作要件
- Node.js (v18以降推奨)
- npm, yarn, pnpm いずれかのパッケージマネージャー
- Supabase アカウント

## 2. データベース (Supabase) の準備

1. [Supabase](https://supabase.com/) にログインし、新しいプロジェクトを作成します。
2. ダッシュボードから **SQL Editor** を開きます。
3. 本リポジトリの `src/backend/db/schema.sql` の内容をコピーし、SQL Editorに貼り付けて **Run** (実行) します。
   これにより、必要なテーブル(`users`, `rooms`, `characters`, `bouquet_logs`)と、ストアドプロシージャ(`increment_bouquet`)が作成されます。

## 3. 環境変数の設定

1. プロジェクトのルートディレクトリ（`Bouquet-Toss/`）に `.env.local` ファイルを作成します。
2. Supabase のダッシュボード (Project Settings -> API) から、URLとキーを取得し、以下のように記載します。

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co

# Supabase API Key (anon/public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# (オプション) API Routes等で特権操作が必要な場合に使用
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

## 4. 依存パッケージのインストールと起動

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
