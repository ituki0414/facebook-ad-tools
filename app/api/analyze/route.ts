// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetails, filterQualityReviews, sampleReviews } from '@/lib/google/places-client';
import { analyzeReviewsWithClaude } from '@/lib/ai/claude-analyzer';
import { supabaseAdmin, saveAnalysis } from '@/lib/supabase';

// ===========================================
// POST /api/analyze
// 店舗を分析してDBに保存
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { place_id, user_id } = body;

    // バリデーション
    if (!place_id || !user_id) {
      return NextResponse.json(
        { error: 'place_id and user_id are required' },
        { status: 400 }
      );
    }

    // 1. Google Places APIから店舗情報とレビューを取得
    console.log(`Fetching place details for: ${place_id}`);
    const placeDetails = await getPlaceDetails(place_id);

    if (!placeDetails.reviews || placeDetails.reviews.length === 0) {
      return NextResponse.json(
        { error: 'No reviews found for this place' },
        { status: 404 }
      );
    }

    // 2. レビューをフィルタリング・サンプリング
    const qualityReviews = filterQualityReviews(placeDetails.reviews);
    const sampledReviews = sampleReviews(qualityReviews, 50);

    console.log(`Analyzing ${sampledReviews.length} reviews...`);

    // 3. Claudeで分析
    const analysis = await analyzeReviewsWithClaude(
      sampledReviews,
      placeDetails.name
    );

    // 4. 店舗をDBに保存（存在しない場合）
    const { data: existingStore, error: storeCheckError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('place_id', place_id)
      .single();

    let storeId: string;

    if (storeCheckError && storeCheckError.code === 'PGRST116') {
      // 店舗が存在しない → 新規作成
      const { data: newStore, error: insertError } = await supabaseAdmin
        .from('stores')
        .insert({
          user_id,
          place_id: placeDetails.place_id,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          location: `POINT(${placeDetails.geometry.location.lng} ${placeDetails.geometry.location.lat})`,
          category: placeDetails.types[0] || 'restaurant',
          rating: placeDetails.rating,
          review_count: placeDetails.user_ratings_total,
          price_level: placeDetails.price_level,
          last_analyzed: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      storeId = newStore.id;
    } else if (existingStore) {
      // 店舗が存在 → 更新
      storeId = existingStore.id;
      await supabaseAdmin
        .from('stores')
        .update({ last_analyzed: new Date().toISOString() })
        .eq('id', storeId);
    } else {
      throw storeCheckError;
    }

    // 5. 分析結果を保存
    const savedAnalysis = await saveAnalysis(storeId, analysis);

    console.log(`Analysis saved: ${savedAnalysis.id}`);

    return NextResponse.json({
      success: true,
      store_id: storeId,
      analysis_id: savedAnalysis.id,
      result: {
        store_name: placeDetails.name,
        factor_scores: analysis.factor_scores,
        overall_score: analysis.overall_score,
        sentiment: analysis.sentiment,
        trending_keywords: analysis.trending_keywords,
        summary: analysis.summary,
        improvements: analysis.improvements,
        review_count: analysis.review_count,
      },
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// ===========================================
// GET /api/analyze?store_id=xxx
// 店舗の最新分析結果を取得
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

    // 店舗情報を取得
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError) throw storeError;

    // 最新の分析結果を取得
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('store_id', storeId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      throw analysisError;
    }

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        rating: store.rating,
        review_count: store.review_count,
        last_analyzed: store.last_analyzed,
      },
      analysis: analysis || null,
    });
  } catch (error: any) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get analysis',
        details: error.message
      },
      { status: 500 }
    );
  }
}
