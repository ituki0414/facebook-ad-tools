// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ===========================================
// Supabase クライアント設定
// ===========================================

// クライアント側用（ブラウザで使用）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// サーバー側用（API Routesで使用）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ===========================================
// 型定義
// ===========================================

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export interface AnalysisResult {
  factor_scores: {
    taste_quality: number;
    service: number;
    atmosphere: number;
    cleanliness: number;
    value_for_money: number;
    location_accessibility: number;
  };
  overall_score: number;
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  trending_keywords: string[];
  summary: string;
  improvements: string[];
  review_count: number;
}

// ===========================================
// レビューキャッシュ機能
// ===========================================

export async function getReviewCache(placeId: string) {
  const { data, error } = await supabaseAdmin
    .from('review_cache')
    .select('*')
    .eq('place_id', placeId)
    .single();

  if (error) return null;

  // キャッシュが7日以上古い場合は無効とみなす
  const cacheAge = Date.now() - new Date(data.cached_at).getTime();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日

  if (cacheAge > maxAge) return null;

  return data.reviews;
}

export async function saveReviewCache(placeId: string, reviews: GoogleReview[]) {
  const { data, error } = await supabaseAdmin
    .from('review_cache')
    .upsert({
      place_id: placeId,
      reviews: reviews,
      cached_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save review cache:', error);
    return null;
  }

  return data;
}

// ===========================================
// 分析結果の保存
// ===========================================

export async function saveAnalysis(storeId: string, analysis: AnalysisResult) {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .insert({
      store_id: storeId,
      factor_scores: analysis.factor_scores,
      overall_score: analysis.overall_score,
      sentiment: analysis.sentiment,
      trending_keywords: analysis.trending_keywords,
      summary: analysis.summary,
      improvements: analysis.improvements,
      review_count: analysis.review_count,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
