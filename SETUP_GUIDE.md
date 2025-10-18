# 🚀 セットアップガイド

## ✅ 現在の状態

プロジェクトのバックエンドとUIが完成しました！

**完成した機能：**
- ✅ Apple風ミニマリストUI
- ✅ レスポンシブデザイン
- ✅ Supabaseクライアント
- ✅ Google Places API統合
- ✅ Claude 3.5 Sonnet分析エンジン
- ✅ 分析APIエンドポイント

---

## 📍 アプリを開く

**👉 [http://localhost:3000](http://localhost:3000)**

スティーブ・ジョブズ風の美しいUIが表示されます！

---

## 🔑 次のステップ: API Keysの設定

現在、APIキーがプレースホルダーになっているため、実際の分析を行うには以下の設定が必要です。

### 1. Google Maps API Key を取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクトを作成
3. 「APIとサービス」→「ライブラリ」で以下を有効化：
   - **Maps JavaScript API**
   - **Places API (New)**
4. 「認証情報」→「APIキーを作成」
5. キーをコピー

### 2. Claude API Key を取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. サインアップ（$5の無料クレジット付き）
3. API Keyを生成
4. キーをコピー

### 3. Supabase プロジェクトを作成

1. [Supabase](https://supabase.com/) でアカウント作成
2. 「New Project」をクリック
3. プロジェクト名・リージョンを設定
4. **Settings → API** でキーを取得：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

### 4. Supabase データベースをセットアップ

1. Supabaseダッシュボードで **SQL Editor** を開く
2. `database/schema.sql` の内容をコピー
3. SQL Editorに貼り付けて実行
4. テーブルが作成されたことを確認

### 5. .env.local にキーを設定

`.env.local` ファイルを開いて、取得したキーを設定：

```bash
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
GOOGLE_PLACES_API_KEY=AIzaSy...your_key_here

# Claude API
ANTHROPIC_API_KEY=sk-ant...your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...your_key_here
SUPABASE_SERVICE_KEY=eyJhb...your_service_key_here
```

### 6. サーバーを再起動

```bash
# Ctrl+Cでサーバーを停止
npm run dev
```

---

## 🧪 APIをテストする

### テスト用コマンド

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "user_id": "test-user-123"
  }'
```

### 成功レスポンスの例

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
    "trending_keywords": ["美味しい", "おしゃれ", "コスパ"],
    "summary": "全体的に高評価...",
    "improvements": ["スタッフ増員", "予約システム"],
    "review_count": 50
  }
}
```

---

## 🎨 UIの特徴

### Apple風デザイン
- ✨ SF Pro フォント
- 🎯 ミニマリスト配色
- 💫 滑らかなアニメーション
- 📱 レスポンシブレイアウト

### 主要セクション
1. **Hero** - 大きな検索バー
2. **Features** - 3カラムの機能紹介
3. **Stats** - 数字で見る実績
4. **CTA** - 行動喚起セクション

---

## 📁 ファイル構成

```
ai-review-location-analyst/
├── app/
│   ├── page.tsx              ← メインUI（Apple風）
│   ├── globals.css           ← デザインシステム
│   └── api/analyze/route.ts  ← 分析API
├── lib/
│   ├── supabase.ts
│   ├── google/places-client.ts
│   └── ai/claude-analyzer.ts
└── database/schema.sql
```

---

## 🚀 次に実装する機能

### Phase 3: インタラクティブ機能
- [ ] Google Maps統合（店舗検索）
- [ ] 分析結果ダッシュボード
- [ ] グラフ描画（Recharts）
- [ ] PDFレポート生成

### Phase 4: 認証・決済
- [ ] Supabase Auth
- [ ] Stripe決済
- [ ] サブスクリプション管理

---

## 💡 ヒント

### API Keyのテスト
各APIが正しく動作するか確認：

```bash
# Google Places APIテスト
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=カフェ&key=YOUR_KEY"

# Claude APIテスト（curlで直接は難しいため、アプリ経由で確認）
```

### トラブルシューティング

**Q: Google Maps APIで403エラー**
→ APIを有効化しているか確認

**Q: Supabaseで接続エラー**
→ URLとキーが正しいか確認

**Q: Claudeで分析が失敗**
→ API Keyの残高を確認（$5無料クレジット）

---

## 🎉 完成！

API Keysを設定すれば、完全に動作するAI分析プラットフォームが完成します！

**素晴らしいプロダクトを作りましょう！** 🚀
