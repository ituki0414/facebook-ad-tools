# 🎯 AIレビュー分析 - バックエンド専用版

**フロントエンドは別途Boltで構築する想定のバックエンドAPI**

---

## 📦 何ができるか

GoogleレビューをAI（Claude 3.5 Sonnet）で分析し、6つの因子でスコアリング＋改善提案を提供するAPIです。

---

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
cd ai-review-location-analyst
npm install
```

### 2. 環境変数を設定

`.env.local` ファイルを作成：

```bash
# Google Places API
GOOGLE_PLACES_API_KEY=your_key_here

# Claude API
ANTHROPIC_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 3. Supabaseセットアップ

1. [Supabase](https://supabase.com) でプロジェクト作成
2. SQL Editorで `database/schema.sql` を実行

### 4. サーバー起動

```bash
npm run dev
```

→ http://localhost:3000

---

## 📡 APIエンドポイント

### POST /api/analyze

店舗を分析してDBに保存

**リクエスト:**
```json
{
  "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "user_id": "test-user-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "store_id": "uuid",
  "analysis_id": "uuid",
  "result": {
    "store_name": "カフェ名",
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
    "trending_keywords": ["美味しい", "おしゃれ"],
    "summary": "全体的に高評価...",
    "improvements": ["スタッフ増員", "予約システム"],
    "review_count": 50
  }
}
```

### GET /api/analyze?store_id=xxx

保存済みの分析結果を取得

---

## 🧪 テスト方法

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "user_id": "test-user-123"
  }'
```

---

## 📁 重要なファイル

```
lib/
├── supabase.ts              # Supabaseクライアント
├── google/places-client.ts  # Google Places API
└── ai/claude-analyzer.ts    # Claude分析エンジン

app/api/analyze/route.ts     # APIエンドポイント

database/schema.sql           # DBスキーマ
```

---

## 🔗 Bolt統合

フロントエンドをBoltで作る場合は、[BOLT_INTEGRATION.md](BOLT_INTEGRATION.md) を参照してください。

---

## 💡 API Key取得方法

1. **Google Places API**: https://console.cloud.google.com/
2. **Claude API**: https://console.anthropic.com/
3. **Supabase**: https://supabase.com/

詳細は [SETUP_GUIDE.md](SETUP_GUIDE.md) を参照

---

## ✅ 完成しているもの

- ✅ Supabase統合
- ✅ Google Places API統合
- ✅ Claude 3.5 Sonnet分析
- ✅ レビューキャッシュ
- ✅ 6因子スコアリング
- ✅ 改善提案生成
- ✅ APIエンドポイント

---

## 🎨 フロントエンドで実装すべきもの

- 🔲 店舗検索UI
- 🔲 分析結果ダッシュボード
- 🔲 レーダーチャート（6因子）
- 🔲 Google Maps表示
- 🔲 認証機能

---

**バックエンドは完璧です！Boltで素敵なUIを作ってください！** 🚀
