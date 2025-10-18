// lib/google/places-client.ts
import { getReviewCache, saveReviewCache, GoogleReview } from '../supabase';

// ===========================================
// Google Places APIクライアント
// ===========================================

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

interface PlaceDetails extends PlaceSearchResult {
  reviews?: GoogleReview[];
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// ===========================================
// 店舗検索（テキスト検索）
// ===========================================

export async function searchPlaces(query: string, location?: string): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    query,
    key: API_KEY!,
    language: 'ja',
  });

  if (location) {
    params.append('location', location);
    params.append('radius', '5000'); // 5km圏内
  }

  const response = await fetch(`${BASE_URL}/textsearch/json?${params}`);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return data.results;
}

// ===========================================
// 店舗詳細取得（レビュー含む）
// ===========================================

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // キャッシュをチェック
  const cachedReviews = await getReviewCache(placeId);

  const params = new URLSearchParams({
    place_id: placeId,
    key: API_KEY!,
    language: 'ja',
    fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,reviews',
  });

  const response = await fetch(`${BASE_URL}/details/json?${params}`);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status}`);
  }

  const placeDetails = data.result as PlaceDetails;

  // レビューをキャッシュに保存（新しい場合のみ）
  if (!cachedReviews && placeDetails.reviews) {
    await saveReviewCache(placeId, placeDetails.reviews);
  } else if (cachedReviews) {
    // キャッシュがあれば使用
    placeDetails.reviews = cachedReviews;
  }

  return placeDetails;
}

// ===========================================
// レビューフィルタリング（質の高いレビューのみ）
// ===========================================

export function filterQualityReviews(reviews: GoogleReview[]): GoogleReview[] {
  return reviews.filter((review) => {
    // 最低条件：50文字以上のテキスト
    if (!review.text || review.text.length < 50) return false;

    // 極端な評価（★1 or ★5）のみは除外（バイアス防止）
    // → バランスの良い分析のため、全評価を含める方針に変更
    // if (review.rating === 1 || review.rating === 5) return false;

    return true;
  });
}

// ===========================================
// レビューサンプリング（最大数制限）
// ===========================================

export function sampleReviews(reviews: GoogleReview[], maxCount: number = 50): GoogleReview[] {
  if (reviews.length <= maxCount) return reviews;

  // 評価の分布を保ちながらサンプリング
  const byRating: { [key: number]: GoogleReview[] } = {};

  reviews.forEach((review) => {
    if (!byRating[review.rating]) byRating[review.rating] = [];
    byRating[review.rating].push(review);
  });

  const sampledReviews: GoogleReview[] = [];
  const perRating = Math.ceil(maxCount / Object.keys(byRating).length);

  Object.values(byRating).forEach((ratingReviews) => {
    // 各評価から均等にサンプリング
    const sampled = ratingReviews
      .sort(() => Math.random() - 0.5) // ランダムシャッフル
      .slice(0, perRating);
    sampledReviews.push(...sampled);
  });

  return sampledReviews.slice(0, maxCount);
}

// ===========================================
// 近隣店舗検索（競合分析用）
// ===========================================

export async function searchNearbyPlaces(
  location: { lat: number; lng: number },
  radius: number = 1000,
  type: string = 'restaurant'
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: radius.toString(),
    type,
    key: API_KEY!,
    language: 'ja',
  });

  const response = await fetch(`${BASE_URL}/nearbysearch/json?${params}`);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return data.results || [];
}
