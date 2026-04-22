# バックエンド設計 (Backend)

本ディレクトリ (`src/backend/` および `src/app/api/`) に関する仕様です。
Vercel Serverless Functions 上で動作する BFF (Backend for Frontend) としての役割と、Supabase へのデータベース操作を担います。

## 1. API 仕様 (`src/app/api/`)

フロントエンドはデータベースを直接触らず、必ず以下のAPIエンドポイントを経由してバックエンドと通信します。

### `POST /api/bouquets`
ブーケ投下のバッチ処理（一括加算）を行います。

- **概要:** フロントエンドでバッファリングされた複数回分のブーケ投下を、1回のリクエストでデータベースに反映させます。
- **Request Body (JSON):**
  ```json
  {
    "roomId": "string (UUID)",
    "characterId": "string (UUID)",
    "userId": "string (UUID)", // ゲストの場合はフロントで生成された一意のID
    "count": 50 // 追加するブーケの数
  }
  ```
- **処理内容:**
  - リクエストのバリデーション。
  - Supabase の RPC `increment_bouquet` を呼び出し、ログの挿入・キャラクターへの加算・ユーザーへの加算を1トランザクションで実行。
- **Response:**
  - `200 OK`: `{"success": true}`
  - `400 / 500 Error`: `{"error": "エラーメッセージ"}`

### `GET /api/rooms/[id]`
指定されたルームの詳細と、関連するキャラクターの情報を取得します。

- **Response (JSON):**
  ```json
  {
    "id": "uuid",
    "name": "ルーム名",
    "characters": [
      {
        "id": "uuid",
        "name": "騎士名",
        "mySentCount": 150 // リクエストしたユーザー自身が送った数のみを返す。総数は返さない。
      }
    ]
  }
  ```

## 2. データベース設計 (Supabase)

データの永続化と集計には Supabase (PostgreSQL) を使用します。
初期化用のSQLスクリプトは `src/backend/db/schema.sql` に配置されています。

### 主要テーブル
1. **`users` (ユーザー)**
   - アカウント作成者だけでなく、ゲストユーザーも内部的なUUIDを割り当ててレコードを作成します(`is_guest: true`)。
   - `display_name` は "ゲスト1" のようになります。
2. **`rooms` (ルーム)**
   - セッションの部屋。名前と入室用パスワードハッシュを保持します。
3. **`characters` (キャラクター/騎士)**
   - ルームに紐づくブーケの受け取り手。`total_bouquets_received` で累計数を管理します。
4. **`bouquet_logs` (ブーケ投下ログ)**
   - 「誰から」「誰へ」「どの部屋で」「何本」贈られたかの履歴を保持します。

### トランザクション処理 (RPC)
複数テーブルの同時更新（ログ追加とカウントアップ）を高速かつ安全に行うため、PostgreSQLのストアドプロシージャ（RPC）である `increment_bouquet` 関数を使用します。APIは個別のテーブルをUPDATEするのではなく、このRPCを呼び出すだけです。
