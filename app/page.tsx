'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // TODO: Implement search
    setTimeout(() => setIsSearching(false), 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎯</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">ReviewAI</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition">機能</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition">料金</a>
            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition">About</a>
            <button className="apple-button text-sm px-6 py-2">
              始める
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span>Powered by Claude 3.5 Sonnet</span>
          </div>

          {/* Main Title */}
          <h1 className="apple-title text-gray-900 mb-6 max-w-4xl mx-auto">
            店舗レビューを
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AIで分析
            </span>
          </h1>

          {/* Subtitle */}
          <p className="apple-body max-w-2xl mx-auto mb-12">
            Googleレビューを6つの因子で分析し、具体的な改善提案を提供。
            <br />
            データドリブンな経営判断をサポートします。
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
            <div className="apple-card p-2 flex items-center space-x-4 hover:shadow-xl transition-all">
              <Search className="w-6 h-6 text-gray-400 ml-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="店舗名または住所を入力..."
                className="flex-1 px-2 py-3 text-lg outline-none"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery}
                className="apple-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? '検索中...' : '分析開始'}
              </button>
            </div>
          </form>

          {/* Demo Preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10 blur-3xl"></div>
            <div className="relative apple-card p-8">
              <img
                src="/api/placeholder/1200/600"
                alt="Dashboard Preview"
                className="w-full h-auto rounded-xl"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="apple-subtitle text-gray-900 mb-4">
              なぜReviewAIなのか
            </h2>
            <p className="apple-body max-w-2xl mx-auto">
              従来の手作業では見落としがちな重要なインサイトを、AIが自動で抽出します
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="apple-card p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                6因子スコアリング
              </h3>
              <p className="text-gray-600 leading-relaxed">
                味・サービス・雰囲気・清潔さ・コスパ・立地の6つの観点から100点満点で評価
              </p>
            </div>

            {/* Feature 2 */}
            <div className="apple-card p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                具体的な改善提案
              </h3>
              <p className="text-gray-600 leading-relaxed">
                AIが実行可能なアクションプランを自動生成。すぐに実践できる提案を提供
              </p>
            </div>

            {/* Feature 3 */}
            <div className="apple-card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🗺️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                競合比較分析
              </h3>
              <p className="text-gray-600 leading-relaxed">
                近隣の競合店舗と比較し、差別化ポイントと改善機会を明確化
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-gray-600">分析店舗数</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-gray-600">精度</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">3分</div>
              <div className="text-gray-600">平均分析時間</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            今すぐ始めましょう
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            3回まで無料でお試しいただけます
          </p>
          <button className="bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition">
            無料で始める
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 text-center text-gray-600">
        <p className="text-sm">
          © 2025 ReviewAI. Powered by Claude Code.
        </p>
      </footer>
    </div>
  );
}
