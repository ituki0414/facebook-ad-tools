// app/api/emotion-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetails, filterQualityReviews, sampleReviews } from '@/lib/google/places-client';
import { analyzeEmotions, generateEmotionBasedInsights } from '@/lib/ai/emotion-analyzer';
import { supabaseAdmin } from '@/lib/supabase';

// ===========================================
// POST /api/emotion-analysis
// 多次元感情分析を実行
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { place_id, store_name } = body;

    if (!place_id) {
      return NextResponse.json(
        { error: 'place_id is required' },
        { status: 400 }
      );
    }

    // 1. Google Places APIからレビュー取得
    console.log(`Fetching reviews for emotion analysis: ${place_id}`);
    const placeDetails = await getPlaceDetails(place_id);

    if (!placeDetails.reviews || placeDetails.reviews.length === 0) {
      return NextResponse.json(
        { error: 'No reviews found for emotion analysis' },
        { status: 404 }
      );
    }

    // 2. レビューをフィルタリング
    const qualityReviews = filterQualityReviews(placeDetails.reviews);
    const sampledReviews = sampleReviews(qualityReviews, 50);

    console.log(`Analyzing emotions from ${sampledReviews.length} reviews...`);

    // 3. 多次元感情分析を実行
    const emotionAnalysis = await analyzeEmotions(
      sampledReviews,
      store_name || placeDetails.name
    );

    // 4. 感情ベースのインサイト生成
    const insights = generateEmotionBasedInsights(
      emotionAnalysis.emotion_scores,
      emotionAnalysis.dominant_emotion
    );

    // 5. データベースに保存（オプション）
    if (body.store_id) {
      await supabaseAdmin
        .from('analyses')
        .update({
          emotion_scores: emotionAnalysis.emotion_scores,
          dominant_emotion: emotionAnalysis.dominant_emotion,
        })
        .eq('store_id', body.store_id)
        .order('analyzed_at', { ascending: false })
        .limit(1);
    }

    return NextResponse.json({
      success: true,
      result: {
        store_name: placeDetails.name,
        review_count: sampledReviews.length,
        emotion_scores: emotionAnalysis.emotion_scores,
        dominant_emotion: emotionAnalysis.dominant_emotion,
        emotion_distribution: emotionAnalysis.emotion_distribution,
        insights: {
          examples: emotionAnalysis.insights,
          recommendations: insights,
        },
      },
    });
  } catch (error: any) {
    console.error('Emotion analysis error:', error);
    return NextResponse.json(
      {
        error: 'Emotion analysis failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ===========================================
// GET /api/emotion-analysis?store_id=xxx
// 保存済みの感情分析結果を取得
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json(
        { error: 'store_id is required' },
        { status: 400 }
      );
    }

    // 最新の分析結果を取得
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .select('emotion_scores, dominant_emotion, analyzed_at')
      .eq('store_id', storeId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!analysis || !analysis.emotion_scores) {
      return NextResponse.json(
        { error: 'No emotion analysis found. Please run analysis first.' },
        { status: 404 }
      );
    }

    // インサイトを再生成
    const insights = generateEmotionBasedInsights(
      analysis.emotion_scores,
      analysis.dominant_emotion
    );

    return NextResponse.json({
      emotion_scores: analysis.emotion_scores,
      dominant_emotion: analysis.dominant_emotion,
      analyzed_at: analysis.analyzed_at,
      insights,
    });
  } catch (error: any) {
    console.error('Get emotion analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get emotion analysis',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
