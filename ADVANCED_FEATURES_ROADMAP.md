# 🚀 高度な機能ロードマップ - RightResponse AI超えを目指して

## 🎯 目標
単なるレビュー分析ツールから、**地域マーケティング基盤プラットフォーム**へ進化させる

---

# Phase 1: データ解析アルゴリズムの進化（優先度：高）

## 1.1 多次元感情分析（Multi-Dimensional Sentiment）

### 現状
```typescript
// 現在: 5段階の単純な感情分析
sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
```

### 改善案
```typescript
// 多次元感情スコア
interface EmotionScores {
  joy: number;           // 喜び (0-100)
  satisfaction: number;  // 満足 (0-100)
  disappointment: number;// 不満 (0-100)
  surprise: number;      // 驚き (0-100)
  anger: number;         // 怒り (0-100)
  expectation: number;   // 期待 (0-100)
}

interface AnalysisResult {
  sentiment: string;
  emotion_scores: EmotionScores;
  dominant_emotion: string; // 最も強い感情
  // ... 既存のフィールド
}
```

### 実装方法
```typescript
// lib/ai/emotion-analyzer.ts
import Anthropic from '@anthropic-ai/sdk';

const EMOTION_PROMPT = `
以下のレビューを分析し、6つの感情軸でスコアリングしてください：

1. 喜び（joy）: ポジティブな驚き、楽しさ
2. 満足（satisfaction）: 期待通り、安心感
3. 不満（disappointment）: 期待外れ、残念
4. 驚き（surprise）: 想定外の体験
5. 怒り（anger）: 強い不満、クレーム
6. 期待（expectation）: 再訪意向、リピート意欲

各感情を0-100点で評価してください。
`;

export async function analyzeEmotions(reviews: GoogleReview[]) {
  // Claude APIで多次元感情分析
}
```

### データベース拡張
```sql
-- analyses テーブルに追加
ALTER TABLE analyses ADD COLUMN emotion_scores JSONB;
ALTER TABLE analyses ADD COLUMN dominant_emotion TEXT;
```

---

## 1.2 業種別カテゴリ分析

### 実装
```typescript
// lib/ai/category-analyzer.ts

interface CategoryScores {
  // 飲食店
  food?: {
    taste: number;
    portion: number;
    presentation: number;
    menu_variety: number;
  };

  // 美容室
  beauty?: {
    technique: number;
    result_satisfaction: number;
    cleanliness: number;
    counseling: number;
  };

  // ホテル
  hotel?: {
    room_quality: number;
    amenities: number;
    bed_comfort: number;
    breakfast: number;
  };
}

// 業種を自動判定してカテゴリ分析
export async function analyzeCategorySpecific(
  reviews: GoogleReview[],
  businessType: string
): Promise<CategoryScores> {
  // 業種に応じた専門プロンプトで分析
}
```

### Claude プロンプト（飲食店例）
```typescript
const RESTAURANT_PROMPT = `
飲食店のレビューを分析し、以下の項目を評価してください：

【味・品質】
- 味付けの良さ
- 食材の新鮮さ
- 調理技術

【盛り付け・見た目】
- プレゼンテーション
- SNS映え

【ボリューム】
- 量の適切さ
- コスパ感

【メニュー】
- バリエーション
- 季節感

各項目を100点満点で評価してください。
`;
```

---

## 1.3 地理的相関分析（Geo-Sentiment）

### データベーススキーマ
```sql
-- 地域別感情スコアテーブル
CREATE TABLE geo_sentiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  area_name TEXT, -- 地域名（例：渋谷駅周辺）
  location GEOGRAPHY(POINT, 4326),
  radius INTEGER, -- 半径（メートル）
  avg_rating NUMERIC(2,1),
  review_count INTEGER,
  positive_ratio NUMERIC(3,2), -- ポジティブレビュー比率
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 空間インデックス
CREATE INDEX idx_geo_sentiments_location ON geo_sentiments USING GIST(location);
```

### API実装
```typescript
// app/api/geo-sentiment/route.ts

export async function POST(request: NextRequest) {
  const { store_id, radius = 1000 } = await request.json();

  // 1. 店舗の位置を取得
  const store = await getStore(store_id);

  // 2. 半径内の全店舗を検索
  const nearbyStores = await searchNearbyStores(
    store.location,
    radius
  );

  // 3. 各店舗のレビューを分析
  const sentimentMap = await analyzeAreaSentiment(nearbyStores);

  // 4. ヒートマップデータを生成
  return NextResponse.json({
    heatmap: generateHeatmapData(sentimentMap),
    summary: {
      your_score: store.rating,
      area_average: calculateAreaAverage(sentimentMap),
      ranking: calculateRanking(store, sentimentMap)
    }
  });
}
```

### フロントエンド（Bolt実装時）
```typescript
// components/GeoHeatmap.tsx
import { GoogleMap, HeatmapLayer } from '@react-google-maps/api';

export function GeoHeatmap({ data }) {
  return (
    <GoogleMap>
      <HeatmapLayer
        data={data.map(point => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          weight: point.sentiment_score
        }))}
        options={{
          radius: 20,
          opacity: 0.6
        }}
      />
    </GoogleMap>
  );
}
```

---

## 1.4 時系列変化トラッキング

### データベース
```sql
-- 時系列スナップショットテーブル
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  snapshot_date DATE NOT NULL,
  rating NUMERIC(2,1),
  review_count INTEGER,
  factor_scores JSONB,
  overall_score INTEGER,
  sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 複合インデックス（時系列クエリ高速化）
CREATE INDEX idx_history_store_date ON analysis_history(store_id, snapshot_date DESC);
```

### トレンド検知API
```typescript
// app/api/trends/route.ts

export async function GET(request: NextRequest) {
  const { store_id, period = 30 } = parseParams(request);

  // 過去データを取得
  const history = await getAnalysisHistory(store_id, period);

  // トレンド分析
  const trends = {
    rating: calculateTrend(history.map(h => h.rating)),
    review_count: calculateTrend(history.map(h => h.review_count)),
    factors: analyzeFactorTrends(history),
    alerts: detectAnomalies(history) // 急変を検知
  };

  return NextResponse.json({
    trends,
    insights: generateTrendInsights(trends)
  });
}

// トレンド計算（線形回帰）
function calculateTrend(values: number[]) {
  // 単純移動平均や線形回帰で傾向を算出
  const trend = linearRegression(values);
  return {
    direction: trend.slope > 0 ? 'up' : 'down',
    rate: Math.abs(trend.slope),
    confidence: trend.r_squared
  };
}
```

### 通知機能
```typescript
// lib/notifications/trend-alerts.ts

export async function checkAndNotify(store_id: string) {
  const trends = await getTrends(store_id);

  // アラート条件
  if (trends.rating.direction === 'down' && trends.rating.rate > 0.1) {
    await sendAlert({
      type: 'rating_decline',
      message: '評価が下落傾向です。早急な改善が必要です。',
      severity: 'high'
    });
  }

  if (trends.review_count.direction === 'up') {
    await sendAlert({
      type: 'engagement_increase',
      message: '口コミが増加中！今がプロモーションのチャンスです。',
      severity: 'info'
    });
  }
}
```

---

# Phase 2: 競合比較・ポジショニング分析

## 2.1 競合MEOスコア比較

### データ構造
```typescript
interface CompetitorComparison {
  your_store: StoreMetrics;
  competitors: CompetitorMetrics[];
  gaps: {
    factor: string;
    your_score: number;
    competitor_avg: number;
    gap: number; // 負の値 = 負けている
  }[];
  recommendations: string[];
}

interface StoreMetrics {
  store_id: string;
  name: string;
  rating: number;
  review_count: number;
  response_rate: number;
  avg_response_time: number; // 分単位
  photo_count: number;
  post_count: number;
  update_frequency: number; // 日単位
}
```

### API実装
```typescript
// app/api/competitors/compare/route.ts

export async function POST(request: NextRequest) {
  const { store_id, competitor_ids } = await request.json();

  // 1. 全店舗のメトリクスを収集
  const yourMetrics = await collectMetrics(store_id);
  const competitorMetrics = await Promise.all(
    competitor_ids.map(id => collectMetrics(id))
  );

  // 2. ギャップ分析
  const gaps = calculateGaps(yourMetrics, competitorMetrics);

  // 3. AIで改善提案
  const recommendations = await generateCompetitiveRecommendations(
    yourMetrics,
    gaps
  );

  return NextResponse.json({
    your_store: yourMetrics,
    competitors: competitorMetrics,
    gaps,
    recommendations
  });
}

// メトリクス収集
async function collectMetrics(placeId: string): Promise<StoreMetrics> {
  const details = await getPlaceDetails(placeId);

  return {
    store_id: placeId,
    name: details.name,
    rating: details.rating,
    review_count: details.user_ratings_total,
    response_rate: calculateResponseRate(details.reviews),
    avg_response_time: calculateAvgResponseTime(details.reviews),
    photo_count: details.photos?.length || 0,
    // Google Business API から投稿数を取得（要実装）
    post_count: 0,
    update_frequency: calculateUpdateFrequency(details)
  };
}
```

### ギャップ分析アルゴリズム
```typescript
function calculateGaps(
  yours: StoreMetrics,
  competitors: StoreMetrics[]
): Gap[] {
  const competitorAvg = {
    rating: average(competitors.map(c => c.rating)),
    response_rate: average(competitors.map(c => c.response_rate)),
    photo_count: average(competitors.map(c => c.photo_count)),
    // ...
  };

  return [
    {
      factor: 'response_rate',
      your_score: yours.response_rate,
      competitor_avg: competitorAvg.response_rate,
      gap: yours.response_rate - competitorAvg.response_rate,
      impact: 'high', // 重要度
      actionable: true
    },
    // ... 他の因子
  ];
}
```

---

# Phase 3: レビュー構造化とマーケ利用

## 3.1 キーワード抽出＋要約

### 実装
```typescript
// lib/ai/keyword-extractor.ts

interface KeywordAnalysis {
  top_keywords: {
    word: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    context: string[]; // 使われている文脈
  }[];
  themes: {
    theme: string;
    keywords: string[];
    sentiment_score: number;
  }[];
  ugc_candidates: string[]; // UGCとして使えるフレーズ
}

export async function extractKeywords(
  reviews: GoogleReview[]
): Promise<KeywordAnalysis> {
  const prompt = `
以下のレビューから、マーケティングに活用できるキーワードを抽出してください：

【抽出観点】
1. 頻出する評価ワード（例：「美味しい」「おしゃれ」）
2. 独自の強み（例：「隠れ家的」「SNS映え」）
3. UGCとして使えるフレーズ（例：「また来たい！」）

レビュー:
${reviews.map(r => r.text).join('\n---\n')}
`;

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: prompt }]
  });

  return parseKeywordAnalysis(response);
}
```

---

## 3.2 MEO投稿・SNS自動生成

### 実装
```typescript
// lib/content-generator/auto-post.ts

interface GeneratedContent {
  google_post: {
    title: string;
    body: string;
    cta_text: string;
    cta_url?: string;
  };
  instagram_caption: {
    text: string;
    hashtags: string[];
  };
  twitter_post: {
    text: string;
    hashtags: string[];
  };
}

export async function generateSocialContent(
  storeName: string,
  positiveReviews: GoogleReview[],
  keywords: string[]
): Promise<GeneratedContent> {
  const prompt = `
店舗名: ${storeName}
お客様の声:
${positiveReviews.slice(0, 5).map(r => `"${r.text}"`).join('\n')}

キーワード: ${keywords.join(', ')}

上記を元に、以下の投稿文を生成してください：

1. Google ビジネスプロフィール投稿（150文字以内）
2. Instagram キャプション（ハッシュタグ含む）
3. Twitter/X 投稿（140文字以内）

実際のお客様の声を活用し、自然な文体で書いてください。
`;

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: prompt }]
  });

  return parseGeneratedContent(response);
}
```

### API
```typescript
// app/api/content/generate/route.ts

export async function POST(request: NextRequest) {
  const { store_id, content_type } = await request.json();

  // 1. ポジティブレビューを取得
  const reviews = await getPositiveReviews(store_id);

  // 2. キーワード抽出
  const keywords = await extractKeywords(reviews);

  // 3. コンテンツ生成
  const content = await generateSocialContent(
    store.name,
    reviews,
    keywords.top_keywords.map(k => k.word)
  );

  // 4. DBに保存（履歴管理）
  await saveGeneratedContent(store_id, content);

  return NextResponse.json(content);
}
```

---

## 3.3 FAQ自動生成

### 実装
```typescript
// lib/ai/faq-generator.ts

interface FAQ {
  question: string;
  answer: string;
  source_reviews: string[]; // ソースとなったレビュー
  frequency: number; // 出現頻度
}

export async function generateFAQ(
  reviews: GoogleReview[]
): Promise<FAQ[]> {
  const prompt = `
以下のレビューから、よくある質問と回答を生成してください：

【観点】
- 予約は必要か
- 駐車場はあるか
- 子連れOKか
- クレカ使えるか
- Wi-Fiあるか

レビュー:
${reviews.map(r => r.text).join('\n---\n')}

実際のレビュー内容を元に、FAQ形式で出力してください。
`;

  // Claude APIで生成
}
```

---

# Phase 4: 地図データ×実績データの統合

## 4.1 マップ経路分析

### データ収集
```typescript
// Google Maps Directions API を使用
// ユーザーの出発地点から店舗までの経路を統計

interface RouteAnalytics {
  origin_areas: {
    area_name: string;
    count: number;
    percentage: number;
  }[];
  popular_routes: {
    from: string;
    to: string;
    count: number;
    avg_duration: number;
  }[];
  transport_modes: {
    walking: number;
    driving: number;
    transit: number;
  };
}
```

---

## 4.2 混雑時間×レビュー分析

### 実装
```typescript
// Google Places APIの「popular_times」を活用

interface TimeBasedAnalysis {
  hourly_sentiment: {
    hour: number;
    avg_rating: number;
    review_count: number;
    common_complaints: string[];
  }[];
  peak_hours: number[];
  recommended_visit_times: number[];
  staffing_recommendations: {
    hour: number;
    current_staff: number;
    recommended_staff: number;
    reason: string;
  }[];
}
```

---

# 実装優先順位

## 🔥 Phase 1（すぐ実装）
1. ✅ 多次元感情分析（1週間）
2. ✅ 業種別カテゴリ分析（1週間）
3. ✅ 時系列トラッキング（3日）

## 🚀 Phase 2（MVP後）
4. ✅ 競合比較機能（1週間）
5. ✅ Geo-Sentiment ヒートマップ（2週間）

## 💎 Phase 3（成長期）
6. ✅ コンテンツ自動生成（1週間）
7. ✅ FAQ生成（3日）
8. ✅ 経路分析（2週間）

---

# 技術スタック

## 追加必要なライブラリ
```bash
npm install @tensorflow/tfjs-node  # 感情分析モデル
npm install natural                # NLP処理
npm install chart.js react-chartjs-2  # グラフ
npm install @turf/turf             # 地理情報計算
```

---

# 予想コスト

## API費用（月間100店舗想定）
- Claude API: $50-100
- Google Places API: $100-200
- Google Maps API: $50-100
**合計: $200-400/月**

---

**これで RightResponse AI を完全に超えられます！** 🚀
