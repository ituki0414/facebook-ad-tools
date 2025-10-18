# 🔌 Bolt用バックエンド統合ガイド

このプロジェクトのバックエンドは完成しています。
Boltでフロントエンドを作る際に使用するAPIエンドポイントとデータ構造を説明します。

---

## 📡 利用可能なAPI

### 1. POST /api/analyze - 店舗分析

**エンドポイント:**
```
POST http://localhost:3000/api/analyze
```

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
    "trending_keywords": ["美味しい", "おしゃれ", "混雑"],
    "summary": "全体的に高評価。特に味と雰囲気が好評。",
    "improvements": [
      "ピーク時のスタッフ増員",
      "予約システムの導入"
    ],
    "review_count": 50
  }
}
```

---

### 2. GET /api/analyze - 分析結果取得

**エンドポイント:**
```
GET http://localhost:3000/api/analyze?store_id=uuid
```

**レスポンス:**
```json
{
  "store": {
    "id": "uuid",
    "name": "店舗名",
    "address": "住所",
    "rating": 4.5,
    "review_count": 123,
    "last_analyzed": "2025-10-19T00:00:00Z"
  },
  "analysis": {
    "id": "uuid",
    "store_id": "uuid",
    "factor_scores": { ... },
    "overall_score": 82,
    "sentiment": "positive",
    "trending_keywords": [...],
    "summary": "...",
    "improvements": [...],
    "analyzed_at": "2025-10-19T00:00:00Z"
  }
}
```

---

## 🗄️ データ構造

### Factor Scores（6因子スコア）

```typescript
{
  taste_quality: number;          // 味・品質 (0-100)
  service: number;                 // サービス (0-100)
  atmosphere: number;              // 雰囲気 (0-100)
  cleanliness: number;             // 清潔さ (0-100)
  value_for_money: number;         // コスパ (0-100)
  location_accessibility: number;  // 立地 (0-100)
}
```

### Sentiment（感情分析）

```typescript
type Sentiment =
  | 'very_positive'  // 非常に好意的
  | 'positive'       // 好意的
  | 'neutral'        // 中立
  | 'negative'       // 否定的
  | 'very_negative'  // 非常に否定的
```

---

## 🎨 Bolt用UI実装アイデア

### 必要なコンポーネント

1. **検索バー**
   - Google Places Autocomplete
   - place_idを取得

2. **分析結果ダッシュボード**
   - 6因子のレーダーチャート
   - 総合スコア表示（大きく）
   - トレンドキーワード（タグクラウド）
   - 改善提案リスト

3. **Google Maps**
   - 店舗位置表示
   - 近隣競合表示

---

## 🔧 環境変数（Boltで設定）

```bash
# バックエンドURL（ローカル開発時）
VITE_API_URL=http://localhost:3000

# Google Maps API（フロントエンド用）
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## 📊 グラフライブラリの推奨

### Recharts（推奨）
```bash
npm install recharts
```

**6因子レーダーチャート例:**
```jsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

const data = [
  { subject: '味・品質', value: 85 },
  { subject: 'サービス', value: 72 },
  { subject: '雰囲気', value: 90 },
  { subject: '清潔さ', value: 88 },
  { subject: 'コスパ', value: 75 },
  { subject: '立地', value: 80 }
];

<RadarChart width={400} height={400} data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="subject" />
  <Radar dataKey="value" fill="#0071e3" fillOpacity={0.6} />
</RadarChart>
```

---

## 🚀 Bolt実装の流れ

### Step 1: プロジェクト作成
```bash
# Boltで新規プロジェクト作成
# React + TypeScript + Vite
```

### Step 2: 必要なパッケージ
```bash
npm install axios recharts @googlemaps/js-api-loader
npm install lucide-react date-fns
```

### Step 3: API呼び出し例
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export async function analyzeStore(placeId: string, userId: string) {
  const { data } = await api.post('/analyze', {
    place_id: placeId,
    user_id: userId
  });
  return data;
}

export async function getAnalysis(storeId: string) {
  const { data } = await api.get(`/analyze?store_id=${storeId}`);
  return data;
}
```

### Step 4: コンポーネント設計
```
src/
├── components/
│   ├── SearchBar.tsx         # 店舗検索
│   ├── AnalysisDashboard.tsx # 分析結果
│   ├── RadarChart.tsx        # 6因子チャート
│   ├── ScoreCard.tsx         # スコア表示
│   └── ImprovementList.tsx   # 改善提案
├── lib/
│   ├── api.ts                # API呼び出し
│   └── types.ts              # 型定義
└── App.tsx
```

---

## 🎯 おすすめUIデザイン

### カラーパレット
```css
--primary: #0071e3;      /* メインブルー */
--success: #34c759;      /* グリーン */
--warning: #ff9500;      /* オレンジ */
--danger: #ff3b30;       /* レッド */
--gray-50: #f5f5f7;
--gray-900: #1d1d1f;
```

### スコアの色分け
```typescript
function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}
```

---

## ✅ バックエンドの確認方法

### サーバー起動
```bash
cd ai-review-location-analyst
npm run dev
```

### APIテスト
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"place_id":"ChIJN1t_tDeuEmsRUsoyG83frY4","user_id":"test"}'
```

---

## 📝 Boltで実装する画面

### 1. ホーム画面
- ヒーロー
- 検索バー
- 機能紹介

### 2. 分析結果画面
- 店舗情報カード
- 6因子レーダーチャート
- 総合スコア（大きく表示）
- トレンドキーワード
- 改善提案リスト
- Google Maps（店舗位置）

### 3. 比較画面（将来）
- 複数店舗の比較
- 並列チャート

---

## 🔗 参考リンク

**バックエンドファイル:**
- [lib/supabase.ts](lib/supabase.ts) - DB接続
- [lib/google/places-client.ts](lib/google/places-client.ts) - Google API
- [lib/ai/claude-analyzer.ts](lib/ai/claude-analyzer.ts) - AI分析
- [app/api/analyze/route.ts](app/api/analyze/route.ts) - APIエンドポイント

**データベース:**
- [database/schema.sql](database/schema.sql) - Supabaseスキーマ

---

## 💡 ヒント

### CORS設定（必要に応じて）
Next.js API Routesは自動的にCORSを処理しますが、
必要であれば `next.config.js` に追加：

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

---

## 🎉 まとめ

**バックエンドは完璧です！**

Boltで以下を実装してください：
1. ✨ 美しいUI
2. 📊 グラフ・チャート
3. 🗺️ Google Maps統合
4. 🔍 検索機能

APIエンドポイントが準備できているので、フロントエンドに集中できます！

頑張ってください！🚀
