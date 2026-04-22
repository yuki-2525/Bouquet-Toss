# Bouquet-Toss 💐

**ブーケを投げるwebアプリ**

TRPG（主に『銀剣のステラナイツ』など）のセッション中に、キャラクターに対してブーケをリアルタイムに投下・集計し、美しく演出するためのツールです。「ボタンを連打して推しの騎士にブーケを浴びせる」爽快感と、献身の可視化をコンセプトにしています。

## 🌟 主な機能

- **リアルタイム・ブーケ演出**: 投げられたブーケが画面に降り注ぎ、山となって積み上がるダイナミックな演出。
- **マルチ・ビジュアル対応**: キャラクター画像を最大2枚まで設定可能。立ち絵の差分や、ペア（監督生と騎士）の並び表示に対応。
- **リッチな統計ページ**: 誰が何個贈ったかの内訳を表示。オーナーによる閲覧権限管理（共有設定）が可能。
- **ドラッグ＆ドロップ並び替え**: ルーム内のキャラクター順を直感的に整理。
- **レスポンシブ & プレミアムデザイン**: PC/スマホ両対応。ダークモード完備。

## 1. アーキテクチャと技術スタック

本プロジェクトは Vercel へのデプロイを前提とし、フロントエンドとバックエンドの役割を1つの Next.js (App Router) リポジトリ内で明確に分離しています。

- **フロントエンド:** Next.js (React), Tailwind CSS, Framer Motion (アニメーション), next-themes (ダーク/ライトモード)
- **バックエンド (BFF):** Next.js Route Handlers (`src/app/api`)
- **データベース:** Supabase (PostgreSQL, Auth)
- **ホスティング:** Vercel

## 2. ディレクトリ構造とファイルの責務

コードの混同を防ぐため、UIロジックとサーバーロジックをディレクトリレベルで分離しています。

```text
Bouquet-Toss/
├── src/
│   ├── app/                    # Next.js App Router のエントリポイント
│   │   ├── layout.tsx          # 全ページ共通のレイアウト・テーマ設定 (Providers)
│   │   ├── page.tsx            # メインの画面 (ルーム・キャラクター一覧など)
│   │   └── api/                # 【バックエンドAPI】Vercel Serverless Functionsとして動作
│   │       ├── bouquets/route.ts  # ブーケ投下のリクエストを受け付けるエンドポイント
│   │       └── rooms/[id]/route.ts # 特定のルーム情報を取得するエンドポイント
│   │
│   ├── frontend/               # 【フロントエンド層】ブラウザで動くコード
│   │   ├── components/         # 再利用可能なUIコンポーネント (騎士カード、ボタン等)
│   │   ├── hooks/              # カスタムフック (バッチ送信ロジック: useBouquetSender等)
│   │   └── apiClient/          # バックエンドAPI (`/api/...`) を叩くためのfetchラッパー
│   │
│   └── backend/                # 【バックエンド層】サーバーで動くコード、DB操作
│       ├── controllers/        # APIのビジネスロジック (バリデーションやSupabase呼び出し)
│       ├── db/                 # Supabase関連の設定
│       │   ├── supabase.ts     # Supabaseクライアント (Anonキー/ServiceRoleキー)
│       │   └── schema.sql      # Supabase初期化用のテーブル定義・RPC定義SQL
```

## 3. バッチ更新ロジックについて

連打のたびにデータベースを更新するとサーバーに多大な負荷がかかるため、以下の仕組みを採用しています。

1. **楽観的UI更新 (フロントエンド):** ボタンをクリックした瞬間、画面上のカウントとエフェクトは即座に発生します。
2. **バッファリング (フロントエンド):** クリックされた回数を `useRef` 等で一時的にメモリに蓄積します。
3. **Debounce送信:** 「最後にクリックしてから一定時間（例: 1〜2秒）」が経過したタイミングで、蓄積されたカウントをまとめてAPIに送信します。
4. **一括更新 (バックエンド):** APIはSupabaseのストアドプロシージャ（RPC）を呼び出し、1回のトランザクションで「ログ記録」「キャラクターへの加算」「ユーザーへの加算」を行います。

## 4. API 仕様 (内部BFF)

フロントエンド (`src/frontend/apiClient`) から呼び出す、Next.js API Routes の設計です。

### `POST /api/bouquets`
ブーケの投下処理（バッチ送信）を行います。

- **Request Body:**
  ```json
  {
    "roomId": "uuid",
    "characterId": "uuid",
    "userId": "uuid", // ゲストの場合はフロント側で生成したUUID
    "count": 50       // まとめて送信するブーケの数
  }
  ```
- **Response:**
  - `200 OK` : `{ "success": true }`
  - `400 Bad Request` : `{ "error": "Invalid payload" }`

### `GET /api/rooms/[roomId]`
ルームの情報と、そこに紐づくキャラクター一覧、それぞれの現在のブーケ獲得数を取得します。

- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "第1回 セッションルーム",
    "characters": [
      {
        "id": "uuid",
        "name": "ステラナイツA",
        "mySentCount": 150 // ユーザー自身が送った数のみを返す
      }
    ]
  }
  ```

## 5. 開発の始め方 (Setup)

### 環境変数の設定
プロジェクト直下に `.env.local` ファイルを作成し、Supabaseの情報を記載してください。

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key (API側で特権操作が必要な場合)
```

### データベースの準備
SupabaseダッシュボードのSQL Editorを開き、`src/backend/db/schema.sql` の内容を貼り付けて実行し、テーブルと関数を作成してください。

### ローカルサーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスして動作を確認します。
