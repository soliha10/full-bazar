import { Star, ArrowRight, ExternalLink, Store, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatSum } from '../utils/productMapper';
import { useLanguage } from '../contexts/LanguageContext';

export interface Product {
  id: string | number;
  name: string;
  title?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  description?: string;
  source?: string;
  url?: string;
  markets?: Array<{
    source: string;
    price: number;
    url: string;
  }>;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  activeMarkets?: string[];
}

const storeLabels: Record<string, string> = {
  uz: "Do'konlar",
  ru: 'Магазины',
  en: 'Stores',
};

const compareLabels: Record<string, string> = {
  uz: 'Barchasini ko\'rish',
  ru: 'Все цены',
  en: 'View all',
};

export function ProductCard({ product, viewMode = 'grid', activeMarkets = [] }: ProductCardProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const activeSet = new Set(activeMarkets.map(m => m.toLowerCase()));
  const sortedMarkets = [...(product.markets ?? [])].sort((a, b) => {
    const aActive = activeSet.has(a.source.toLowerCase()) ? 0 : 1;
    const bActive = activeSet.has(b.source.toLowerCase()) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return a.price - b.price;
  });
  const bestPrice = sortedMarkets[0]?.price ?? product.price;
  const worstPrice = sortedMarkets[sortedMarkets.length - 1]?.price;
  const savings = worstPrice && worstPrice > bestPrice ? worstPrice - bestPrice : 0;

  // ── List view ──────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 flex gap-4 group hover:shadow-lg hover:shadow-violet-500/8 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-300">
        <Link
          to={`/product/${product.id}`}
          className="relative w-28 h-28 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden"
        >
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'; }}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-lg">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">{product.rating}</span>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">({product.reviews})</span>
            </div>
            <Link to={`/product/${product.id}`}>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                {product.name}
              </h3>
            </Link>
          </div>

          {sortedMarkets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sortedMarkets.slice(0, 3).map((m, idx) => (
                <span
                  key={m.source}
                  className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                    idx === 0
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {idx === 0 && <TrendingDown className="w-2.5 h-2.5" />}
                  {m.source} · {formatSum(m.price)}
                </span>
              ))}
              {sortedMarkets.length > 3 && (
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold self-center">
                  +{sortedMarkets.length - 3} →
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">
                {t.listing.startingFrom}
              </p>
              <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">{formatSum(bestPrice)}</p>
            </div>
            <button
              onClick={() => navigate(`/product/${product.id}`)}
              className="w-11 h-11 flex items-center justify-center bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 group flex flex-col hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-violet-900/20 hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-300">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800/50 block">
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f5f3ff/7c3aed?text=📱'; }}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {sortedMarkets.length > 1 && (
            <div className="flex items-center gap-1 bg-violet-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-violet-500/30">
              <Store className="w-2.5 h-2.5" />
              {sortedMarkets.length} {storeLabels[language] ?? 'Stores'}
            </div>
          )}
          {savings > 0 && (
            <div className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-emerald-500/30">
              <TrendingDown className="w-2.5 h-2.5" />
              -{formatSum(savings)}
            </div>
          )}
        </div>

        {sortedMarkets[0]?.source && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-700 dark:text-gray-300 font-black uppercase tracking-wider">
              {sortedMarkets[0].source}
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-gray-800 dark:text-gray-200">{product.rating}</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            ({product.reviews} {t.product.reviews})
          </span>
        </div>

        {/* Name */}
        <Link to={`/product/${product.id}`} className="flex-1 mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors min-h-10">
            {product.name}
          </h3>
        </Link>

        {/* Prices */}
        <div className="mb-4">
          {sortedMarkets.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {storeLabels[language] ?? 'Stores'}
                </p>
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-black">
                  {sortedMarkets.length} ta
                </span>
              </div>
              <div className="space-y-1">
                {sortedMarkets.slice(0, 3).map((m, idx) => (
                  <div
                    key={m.source}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all ${
                      idx === 0
                        ? 'bg-violet-50/70 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800/50'
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <span className={`text-[11px] font-bold truncate ${idx === 0 ? 'text-violet-700 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {m.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black ${idx === 0 ? 'text-violet-700 dark:text-violet-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {formatSum(m.price)}
                      </span>
                      {m.url && m.url !== '#' && (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-300 dark:text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {sortedMarkets.length > 3 && (
                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="w-full text-center py-2.5 text-xs font-black text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors uppercase tracking-wider mt-1 min-h-[44px]"
                >
                  {compareLabels[language] ?? 'View all'} ({sortedMarkets.length})
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                {t.listing.startingFrom}
              </p>
              <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                {formatSum(product.price)}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 active:scale-[0.98] transition-all"
        >
          {t.landing.trending.comparePrices}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
