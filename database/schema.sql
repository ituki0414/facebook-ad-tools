-- ============================================
-- AIレビュー・ロケーションアナリスト
-- Supabase データベーススキーマ
-- ============================================

-- PostGIS拡張を有効化（地理情報処理用）
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. ユーザーテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  credits_remaining INTEGER DEFAULT 3, -- 無料プランの残り分析回数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 店舗テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  place_id TEXT UNIQUE NOT NULL, -- Google Places ID
  name TEXT NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS地理情報（緯度経度）
  category TEXT, -- restaurant, cafe, hotel, etc.
  rating NUMERIC(2, 1), -- Google評価
  review_count INTEGER, -- レビュー数
  price_level INTEGER, -- 価格帯（1-4）
  last_analyzed TIMESTAMPTZ, -- 最後に分析した日時
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 地理情報インデックス（近隣検索高速化）
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_place_id ON stores(place_id);

-- ============================================
-- 3. 分析結果テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- 6因子スコア（JSONB形式）
  factor_scores JSONB NOT NULL,

  -- 総合スコア
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 感情分析
  sentiment TEXT CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),

  -- トレンドキーワード
  trending_keywords TEXT[] DEFAULT '{}',

  -- サマリー
  summary TEXT,

  -- 改善提案
  improvements TEXT[] DEFAULT '{}',

  -- 分析したレビュー数
  review_count INTEGER,

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_store_id ON analyses(store_id);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON analyses(analyzed_at DESC);

-- ============================================
-- 4. レビューキャッシュテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS review_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT UNIQUE NOT NULL,
  reviews JSONB NOT NULL, -- Google Reviewsの配列
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_cache_place_id ON review_cache(place_id);
CREATE INDEX IF NOT EXISTS idx_review_cache_cached_at ON review_cache(cached_at DESC);

-- ============================================
-- 5. 比較分析テーブル（競合比較用）
-- ============================================
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  store_ids UUID[] NOT NULL, -- 比較対象店舗のID配列
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON comparisons(user_id);

-- ============================================
-- 6. PDFレポートテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  pdf_url TEXT, -- Supabase Storageへのパス
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_store_id ON reports(store_id);

-- ============================================
-- 7. サブスクリプション履歴テーブル（Stripe連携用）
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================

-- ユーザーは自分のデータのみ閲覧可能
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own stores"
  ON stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analyses of their stores"
  ON analyses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = analyses.store_id AND stores.user_id = auth.uid()
  ));

ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own comparisons"
  ON comparisons FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- トリガー：updated_at自動更新
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- サンプルデータ（開発用）
-- ============================================
-- INSERT INTO users (email, name, subscription_tier) VALUES
-- ('test@example.com', 'テストユーザー', 'pro');
