// lib/ai/claude-analyzer.ts
import Anthropic from '@anthropic-ai/sdk';
import { GoogleReview, AnalysisResult } from '../supabase';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ===========================================
// 因子分析結果の型定義
// ===========================================

interface FactorScores {
  taste_quality: number;       // 味・品質
  service: number;              // サービス
  atmosphere: number;           // 雰囲気
  cleanliness: number;          // 清潔さ
  value_for_money: number;      // コスパ
  location_accessibility: number; // 立地・アクセス
}

// ===========================================
// レビュー分析プロンプト生成
// ===========================================

function createAnalysisPrompt(reviews: GoogleReview[], storeName: string): string {
  const reviewTexts = reviews
    .map((r, i) => `[レビュー ${i + 1}] 評価: ★${r.rating}\n${r.text}`)
    .join('\n\n---\n\n');

  return `あなたは店舗レビューの専門分析AIです。以下の「${storeName}」に関する${reviews.length}件のレビューを分析し、構造化されたJSONレスポンスを返してください。

# レビューデータ
${reviewTexts}

# 分析タスク
以下の6つの因子について、100点満点でスコアリングしてください：

1. **taste_quality (味・品質)**: 料理やサービスの質
2. **service (サービス)**: 接客態度、スタッフの対応
3. **atmosphere (雰囲気)**: 店内の居心地、デザイン
4. **cleanliness (清潔さ)**: 店内・トイレの清潔度
5. **value_for_money (コスパ)**: 価格に対する満足度
6. **location_accessibility (立地・アクセス)**: 駅からの距離、駐車場

# レスポンス形式（必ずこの形式で返してください）
\`\`\`json
{
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
  "trending_keywords": ["美味しい", "おしゃれ", "混雑", "コスパ良い", "駅近"],
  "summary": "全体的に高評価。特に味と雰囲気が好評。一方でサービスに改善の余地あり。",
  "improvements": [
    "ピーク時のスタッフ増員でスムーズな接客を実現",
    "予約システムの導入で待ち時間を短縮",
    "メニュー説明の充実化"
  ]
}
\`\`\`

## 重要な指示
- 日本語で分析してください
- sentiment は "very_positive", "positive", "neutral", "negative", "very_negative" のいずれか
- trending_keywords は最大10個まで
- improvements は具体的で実行可能な提案を3〜5個
- 必ずJSONフォーマットで返してください（コメントなし）
`;
}

// ===========================================
// Claude APIでレビューを分析
// ===========================================

export async function analyzeReviewsWithClaude(
  reviews: GoogleReview[],
  storeName: string
): Promise<AnalysisResult> {
  const prompt = createAnalysisPrompt(reviews, storeName);

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.2, // 低めの温度で安定した分析
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // レスポンスからJSONを抽出
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // JSONブロックを抽出（```json ... ```）
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : content.text;

    const analysis = JSON.parse(jsonText);

    // バリデーション
    if (!analysis.factor_scores || !analysis.sentiment) {
      throw new Error('Invalid analysis format from Claude');
    }

    return {
      ...analysis,
      review_count: reviews.length,
    };
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw new Error(`Failed to analyze reviews: ${error}`);
  }
}

// ===========================================
// バッチ分析（複数店舗の比較）
// ===========================================

export async function batchAnalyzeStores(
  stores: Array<{ name: string; reviews: GoogleReview[] }>
): Promise<Map<string, AnalysisResult>> {
  const results = new Map<string, AnalysisResult>();

  for (const store of stores) {
    try {
      const analysis = await analyzeReviewsWithClaude(store.reviews, store.name);
      results.set(store.name, analysis);

      // API Rate Limitを考慮して1秒待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to analyze ${store.name}:`, error);
    }
  }

  return results;
}

// ===========================================
// 感情スコアの数値化
// ===========================================

export function sentimentToScore(
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
): number {
  const scores = {
    very_positive: 100,
    positive: 75,
    neutral: 50,
    negative: 25,
    very_negative: 0,
  };
  return scores[sentiment];
}

// ===========================================
// 因子スコアの平均計算
// ===========================================

export function calculateAverageScore(factors: FactorScores): number {
  const scores = Object.values(factors);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
