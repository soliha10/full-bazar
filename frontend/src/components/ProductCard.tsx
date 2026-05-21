import { Star, ArrowRight, ExternalLink, Store, TrendingDown, Heart, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatSum } from '../utils/productMapper';
import { useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { usePriceWatch } from '../hooks/usePriceWatch';

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
  uz: "Do'kon",
  ru: 'Магазин',
  en: 'Store',
};

export function ProductCard({ product, viewMode = 'grid', activeMarkets = [] }: ProductCardProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toggle, isLiked } = useFavorites();
  const { user } = useAuth();
  const { toggle: toggleWatch, isWatched } = usePriceWatch();
  const liked = isLiked(product.id);
  const watching = isWatched(product.id);

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
  const bestMarket = sortedMarkets[0];

  // ── List view ──────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 flex gap-3 group hover:shadow-lg hover:shadow-violet-500/8 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-200 cursor-pointer active:scale-[0.99]"
      >
        {/* Image */}
        <div className="relative w-24 h-24 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'; }}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />
          {sortedMarkets.length > 1 && (
            <div className="absolute bottom-1 left-1 bg-violet-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">
              {sortedMarkets.length} ta
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(product); }}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-lg bg-white/90 dark:bg-gray-900/90 shadow-sm transition-all active:scale-90"
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-lg">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">{product.rating}</span>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">({product.reviews})</span>
              {savings > 0 && (
                <span className="ml-auto flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-lg">
                  <TrendingDown className="w-2.5 h-2.5" />
                  -{formatSum(savings)}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">
                {sortedMarkets.length > 0
                  ? `${sortedMarkets.length} ${storeLabels[language] ?? 'Store'}dan`
                  : t.listing.startingFrom}
              </p>
              <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">{formatSum(bestPrice)}</p>
            </div>
            <div className="w-10 h-10 flex items-center justify-center bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-violet-900/20 hover:-translate-y-0.5 hover:border-violet-200/70 dark:hover:border-violet-800/50 transition-all duration-200 cursor-pointer active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f5f3ff/7c3aed?text=📱'; }}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
        />

        {/* Store count — top left */}
        {sortedMarkets.length > 1 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-violet-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-sm shadow-violet-500/30">
            <Store className="w-2.5 h-2.5" />
            {sortedMarkets.length}
          </div>
        )}

        {/* Savings badge — top right (hidden when liked button occupies spot) */}
        {savings > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-sm shadow-emerald-500/30">
            <TrendingDown className="w-2.5 h-2.5" />
            -{formatSum(savings)}
          </div>
        )}

        {/* Heart button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(product); }}
          className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-90 ${
            liked ? 'bg-red-50 dark:bg-red-900/30' : 'bg-white/90 dark:bg-gray-900/90'
          }`}
        >
          <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>

        {/* Bell — price watch, auth-gated */}
        {user && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleWatch(product); }}
            className={`absolute bottom-2 left-2 w-7 h-7 flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-90 ${
              watching
                ? 'bg-violet-600 text-white shadow-violet-500/30'
                : 'bg-white/90 dark:bg-gray-900/90 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3 md:p-4 flex flex-col flex-1 gap-2">
        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-gray-800 dark:text-gray-200">{product.rating}</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            ({product.reviews})
          </span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-[13px] md:text-[15px] leading-snug line-clamp-2 flex-1 min-h-[36px] md:min-h-[42px]">
          {product.name}
        </h3>

        {/* Price + best store */}
        <div>
          {bestMarket && (
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {bestMarket.source}
              </span>
              {bestMarket.url && bestMarket.url !== '#' && (
                <a
                  href={bestMarket.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto text-gray-300 dark:text-gray-600 hover:text-violet-500 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
          <p className="text-[18px] md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            {formatSum(bestPrice)}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
          className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-black text-xs md:text-[13px] py-3 md:py-3.5 rounded-xl shadow-sm shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.98] transition-all mt-auto"
        >
          {t.landing.trending.comparePrices}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
