# バックエンド設計 (Backend)

本ディレクトリ (`src/backend/` および `src/app/api/`) に関する仕様です。
Vercel Serverless Functions 上で動作する BFF (Backend for Frontend) としての役割と、Supabase へのデータベース操作を担います。

## 1. API 仕様 (`src/app/api/`)

### `POST /api/bouquets`
ブーケ投下のバッチ処理（一括加算）を行います。
- **概要:** フロントエンドでバッファリングされた複数回分のブーケ投下を、1回のリクエストでデータベースに反映させます。
- **RPC `increment_bouquet`**: ログの挿入、キャラクターの累計加算、ユーザーの累計加算を1トランザクションで実行します。

### `GET /api/rooms/[id]`
指定されたルームの詳細と、関連するキャラクターの情報を取得します。
- **権限管理**: リクエストしたユーザーがオーナー（または閲覧許可設定済み）の場合、キャラクターの `totalBouquets` を返却します。それ以外の場合は `null` または秘匿された値を返却します。

### `GET /api/rooms/[id]/characters/[characterId]/stats`
特定のキャラクターに対するブーケ投下の詳細内訳（誰が何本贈ったか）を取得します。
- **概要**: 贈ってくれた人々のリストとそれぞれの合計本数を返却します。
- **セキュリティ**: 原則としてキャラクターのオーナーのみが詳細を確認できます。

### `PATCH /api/rooms/[id]/characters/[characterId]/access`
統計ページの閲覧権限を更新します。
- **概要**: オーナーが、特定のユーザーに対して統計情報の閲覧を許可/禁止します。

### `GET /api/rooms/[id]/events` (SSE)
ルーム内のリアルタイム更新をプッシュ通知します。
- **通知内容**:
  - `CHARACTER_UPDATE`: ブーケ数の増加
  - `CHARACTER_INSERT`: 新キャラクターの追加
  - `MEMBERS_UPDATE`: 参加メンバーの更新

## 2. データベース設計 (Supabase)

### 主要テーブル
1. **`users`**: ゲストおよびログインユーザー。`is_guest` フラグで管理。
2. **`rooms`**: ルーム情報とパスワード、作成者情報を保持。
3. **`characters`**: `avatar_url`（カンマ区切りで複数保持可能）、`total_bouquets_received` などを保持。
4. **`bouquet_logs`**: 投下履歴。
5. **`character_access_controls`**: 統計情報の閲覧権限マトリクス。

### リアルタイム同期
Supabase の **Realtime (Broadcast/Presence)** ではなく、Next.js Route Handlers を介した **Server-Sent Events (SSE)** を採用しています。これにより、ビジネスロジックを挟んだ上での確実なデータ配信を実現しています。
