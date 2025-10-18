# 🎯 AI Review Location Analyst

GoogleレビューをAI（Claude 3.5 Sonnet）で分析し、店舗改善の示唆を提供するプラットフォーム

## 📋 機能概要

- **レビュー分析**: Googleレビューを6つの因子でスコアリング
  - 味・品質
  - サービス
  - 雰囲気
  - 清潔さ
  - コスパ
  - 立地・アクセス
- **感情分析**: レビュー全体のセンチメント判定
- **トレンドキーワード抽出**: 頻出する重要なキーワードを特定
- **改善提案**: AIによる具体的な改善アクション提案
- **地図表示**: Google Maps上での店舗表示・検索
- **競合比較**: 近隣店舗との比較分析
- **PDFレポート生成**: 分析結果をPDF化してダウンロード

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (グラフ描画)
- **Lucide React** (アイコン)

### バックエンド
- **Next.js API Routes**
- **Supabase** (PostgreSQL + PostGIS)
- **Google Places API** (店舗・レビューデータ)
- **Claude 3.5 Sonnet** (AI分析)

### インフラ
- **Vercel** (ホスティング)
- **Supabase** (データベース + ストレージ)
- **Stripe** (決済)

## 📁 プロジェクト構造

```
ai-review-location-analyst/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts        # 分析APIエンドポイント
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # ホームページ
│   └── globals.css             # グローバルスタイル
├── lib/
│   ├── supabase.ts             # Supabaseクライアント
│   ├── google/
│   │   └── places-client.ts    # Google Places API統合
│   └── ai/
│       └── claude-analyzer.ts  # Claude分析エンジン
├── database/
│   └── schema.sql              # データベーススキーマ
├── .env.local                  # 環境変数（ローカル）
└── .env.example                # 環境変数テンプレート
```

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
cd ai-review-location-analyst
npm install
```

### 2. API Keysの取得

#### Google Maps API
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクトを作成
3. 以下のAPIを有効化：
   - Maps JavaScript API
   - Places API (New)
4. APIキーを作成

#### Claude API
1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Keyを生成（$5の無料クレジットあり）

#### Supabase
1. [Supabase](https://supabase.com/) でプロジェクト作成
2. Settings → API でキーを取得
3. SQL Editorで `database/schema.sql` を実行

### 3. 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_PLACES_API_KEY=your_key_here

# Anthropic Claude API
ANTHROPIC_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

→ http://localhost:3000 が開きます

## 🧪 APIテスト

### 店舗を分析

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "user_id": "test-user-id"
  }'
```

### 分析結果を取得

```bash
curl "http://localhost:3000/api/analyze?store_id=<store_id>"
```

## 📊 分析結果の例

```json
{
  "success": true,
  "store_id": "uuid",
  "analysis_id": "uuid",
  "result": {
    "store_name": "カフェ・ド・パリ",
    "factor_scores": {
      "taste_quality": 85,
      "service": 72,
      "atmosphere": 90,
      "cleanliness": 88,
      "value_for_money": 75,
      "location_accessibility": 80
    },
    "overall_score": 82,
    "sentiment": "positive",
    "trending_keywords": ["美味しい", "おしゃれ", "混雑", "コスパ良い"],
    "summary": "全体的に高評価。特に味と雰囲気が好評。",
    "improvements": [
      "ピーク時のスタッフ増員",
      "予約システムの導入",
      "メニュー説明の充実化"
    ],
    "review_count": 50
  }
}
```

## 🎨 次の実装ステップ

### Phase 1: 基盤 ✅
- [x] プロジェクト初期化
- [x] Supabaseクライアント
- [x] Google Places API統合
- [x] Claude分析エンジン
- [x] 分析API

### Phase 2: UI実装 🔲
- [ ] 地図コンポーネント
- [ ] 店舗検索UI
- [ ] ダッシュボード
- [ ] 分析結果表示
- [ ] グラフ描画

### Phase 3: 機能拡張 🔲
- [ ] 競合比較機能
- [ ] PDFレポート生成
- [ ] 認証機能
- [ ] サブスクリプション（Stripe）

## 📝 ライセンス

MIT

## 👨‍💻 開発者

Created with Claude Code
