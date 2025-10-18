// lib/ai/emotion-analyzer.ts
import Anthropic from '@anthropic-ai/sdk';
import { GoogleReview } from '../supabase';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ===========================================
// 多次元感情分析の型定義
// ===========================================

export interface EmotionScores {
  joy: number;           // 喜び (0-100)
  satisfaction: number;  // 満足 (0-100)
  disappointment: number;// 不満 (0-100)
  surprise: number;      // 驚き (0-100)
  anger: number;         // 怒り (0-100)
  expectation: number;   // 期待・再訪意向 (0-100)
}

export interface EnhancedAnalysisResult {
  // 既存の分析結果
  factor_scores: Record<string, number>;
  overall_score: number;
  sentiment: string;
  trending_keywords: string[];
  summary: string;
  improvements: string[];
  review_count: number;

  // 新機能: 多次元感情スコア
  emotion_scores: EmotionScores;
  dominant_emotion: string;
  emotion_distribution: {
    emotion: string;
    percentage: number;
  }[];
}

// ===========================================
// 多次元感情分析プロンプト
// ===========================================

function createEmotionAnalysisPrompt(reviews: GoogleReview[], storeName: string): string {
  const reviewTexts = reviews
    .map((r, i) => `[レビュー ${i + 1}] 評価: ★${r.rating}\n${r.text}`)
    .join('\n\n---\n\n');

  return `あなたは感情分析の専門家です。以下の「${storeName}」に関するレビューを分析し、多次元感情スコアを算出してください。

# レビューデータ
${reviewTexts}

# 感情分析タスク
以下の6つの感情軸について、100点満点でスコアリングしてください：

## 1. 喜び（Joy）
- ポジティブな驚き、楽しさ、ワクワク感
- キーワード例: 「最高」「楽しい」「感動」「幸せ」

## 2. 満足（Satisfaction）
- 期待通り、安心感、納得感
- キーワード例: 「良かった」「満足」「安心」「丁度良い」

## 3. 不満（Disappointment）
- 期待外れ、残念、物足りなさ
- キーワード例: 「残念」「イマイチ」「期待はずれ」「普通」

## 4. 驚き（Surprise）
- 想定外の体験（良い意味でも悪い意味でも）
- キーワード例: 「びっくり」「予想外」「意外」「驚いた」

## 5. 怒り（Anger）
- 強い不満、クレーム、憤り
- キーワード例: 「ひどい」「最悪」「許せない」「二度と行かない」

## 6. 期待（Expectation）
- 再訪意向、リピート意欲、推薦意向
- キーワード例: 「また来たい」「リピート確定」「おすすめ」「友達を連れて」

# レスポンス形式（必ずこの形式で返してください）
\`\`\`json
{
  "emotion_scores": {
    "joy": 75,
    "satisfaction": 85,
    "disappointment": 20,
    "surprise": 45,
    "anger": 5,
    "expectation": 80
  },
  "dominant_emotion": "satisfaction",
  "emotion_insights": {
    "joy_examples": ["料理が本当に美味しくて感動しました"],
    "satisfaction_examples": ["期待通りの品質で満足"],
    "disappointment_examples": ["もう少しボリュームが欲しかった"],
    "surprise_examples": ["こんな隠れ家的なお店があるとは"],
    "anger_examples": [],
    "expectation_examples": ["絶対にまた来ます！"]
  }
}
\`\`\`

## 重要な指示
- 各感情スコアは0-100の整数
- dominant_emotionは最もスコアが高い感情
- emotion_insightsには実際のレビュー引用を含める
- 必ずJSONフォーマットで返す（コメントなし）
`;
}

// ===========================================
// 多次元感情分析の実行
// ===========================================

export async function analyzeEmotions(
  reviews: GoogleReview[],
  storeName: string
): Promise<{
  emotion_scores: EmotionScores;
  dominant_emotion: string;
  emotion_distribution: { emotion: string; percentage: number }[];
  insights: Record<string, string[]>;
}> {
  const prompt = createEmotionAnalysisPrompt(reviews, storeName);

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // JSONブロックを抽出
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : content.text;
    const result = JSON.parse(jsonText);

    // 感情分布を計算（パーセンテージ）
    const totalScore = Object.values(result.emotion_scores).reduce(
      (sum: number, score: any) => sum + score,
      0
    ) as number;

    const emotion_distribution = Object.entries(result.emotion_scores).map(
      ([emotion, score]) => ({
        emotion,
        percentage: Math.round(((score as number) / totalScore) * 100),
      })
    );

    return {
      emotion_scores: result.emotion_scores,
      dominant_emotion: result.dominant_emotion,
      emotion_distribution,
      insights: result.emotion_insights || {},
    };
  } catch (error) {
    console.error('Emotion analysis error:', error);
    throw new Error(`Failed to analyze emotions: ${error}`);
  }
}

// ===========================================
// 感情スコアの可視化データ生成
// ===========================================

export function generateEmotionChartData(emotion_scores: EmotionScores) {
  return {
    labels: ['喜び', '満足', '不満', '驚き', '怒り', '期待'],
    datasets: [
      {
        label: '感情スコア',
        data: [
          emotion_scores.joy,
          emotion_scores.satisfaction,
          emotion_scores.disappointment,
          emotion_scores.surprise,
          emotion_scores.anger,
          emotion_scores.expectation,
        ],
        backgroundColor: 'rgba(0, 113, 227, 0.2)',
        borderColor: 'rgba(0, 113, 227, 1)',
        borderWidth: 2,
      },
    ],
  };
}

// ===========================================
// 感情に基づく推薦メッセージ生成
// ===========================================

export function generateEmotionBasedInsights(
  emotion_scores: EmotionScores,
  dominant_emotion: string
): string[] {
  const insights: string[] = [];

  // 喜びが高い
  if (emotion_scores.joy > 70) {
    insights.push('✨ お客様に強い喜びを与えている要素を、積極的にアピールしましょう');
  }

  // 満足が高い
  if (emotion_scores.satisfaction > 80) {
    insights.push('👍 高い満足度を維持。現在の品質を保ち続けることが重要です');
  }

  // 不満が目立つ
  if (emotion_scores.disappointment > 40) {
    insights.push('⚠️ 期待値とのギャップに注意。事前情報の見直しをおすすめします');
  }

  // 驚きが高い
  if (emotion_scores.surprise > 60) {
    insights.push('🎉 予想外の体験を提供！この独自性を強みにできます');
  }

  // 怒りが検出された
  if (emotion_scores.anger > 20) {
    insights.push('🚨 クレーム対応が急務。カスタマーサポート体制の強化を');
  }

  // 期待が高い（リピート意向）
  if (emotion_scores.expectation > 75) {
    insights.push('🔄 高いリピート意向！ロイヤルティプログラムの導入を検討');
  }

  return insights;
}

// ===========================================
// 感情トレンド分析（時系列）
// ===========================================

export interface EmotionTrend {
  date: string;
  emotion_scores: EmotionScores;
  dominant_emotion: string;
}

export function analyzeEmotionTrends(
  history: EmotionTrend[]
): {
  improving_emotions: string[];
  declining_emotions: string[];
  stable_emotions: string[];
} {
  if (history.length < 2) {
    return {
      improving_emotions: [],
      declining_emotions: [],
      stable_emotions: [],
    };
  }

  const latest = history[history.length - 1].emotion_scores;
  const previous = history[history.length - 2].emotion_scores;

  const improving: string[] = [];
  const declining: string[] = [];
  const stable: string[] = [];

  Object.keys(latest).forEach((emotion) => {
    const diff = latest[emotion as keyof EmotionScores] - previous[emotion as keyof EmotionScores];

    if (diff > 5) {
      improving.push(emotion);
    } else if (diff < -5) {
      declining.push(emotion);
    } else {
      stable.push(emotion);
    }
  });

  return {
    improving_emotions: improving,
    declining_emotions: declining,
    stable_emotions: stable,
  };
}
