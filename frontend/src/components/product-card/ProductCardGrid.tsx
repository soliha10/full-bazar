import { Star, ArrowRight, ExternalLink, Store, TrendingDown, Heart, Bell, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import { trackStoreClick } from '../../services/tracking';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';

// ── Grid view ──────────────────────────────────────────────────────────────
export function ProductCardGrid({ product, card }: { product: Product; card: ProductCardState }) {
  const {
    t, user, href, stop, liked, watching, comparing, compareDisabled, compareTitle,
    sortedMarkets, bestPrice, savings, bestMarket,
  } = card;
  return (
    <div
      onClick={card.open}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-violet-900/20 hover:-translate-y-0.5 hover:border-violet-200/70 dark:hover:border-violet-800/50 transition-all duration-200 cursor-pointer active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative h-36 md:h-40 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        <img
          src={product.image || 'https://placehold.co/400x400/f5f3ff/7c3aed?text=📱'}
          alt={product.name}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f5f3ff/7c3aed?text=📱'; }}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
        />

        {/* Store count — top left */}
        {sortedMarkets.length > 1 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-violet-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-violet-500/30">
            <Store className="w-3 h-3" />
            {sortedMarkets.length}
          </div>
        )}

        {/* Compare toggle + savings badge — top right */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); card.toggleCompare(); }}
            title={compareTitle}
            className={`w-7 h-7 flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-90 ${
              comparing ? 'bg-violet-600 text-white' : 'bg-white/90 dark:bg-gray-900/90 text-gray-400'
            } ${compareDisabled ? 'opacity-40' : ''}`}
          >
            <Scale className="w-4 h-4" />
          </button>
          {savings > 0 && (
            <div className="flex items-center gap-0.5 bg-emerald-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-emerald-500/30">
              <TrendingDown className="w-3 h-3" />
              -{formatSum(savings)}
            </div>
          )}
        </div>

        {/* Heart button */}
        <button
          onClick={(e) => { e.stopPropagation(); card.toggleLike(); }}
          className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-90 ${
            liked ? 'bg-red-50 dark:bg-red-900/30' : 'bg-white/90 dark:bg-gray-900/90'
          }`}
        >
          <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>

        {/* Bell — price watch, auth-gated */}
        {user && (
          <button
            onClick={(e) => { e.stopPropagation(); card.toggleWatch(); }}
            title={watching ? t.common.watchRemove : t.common.watchAdd}
            className={`absolute bottom-2 left-2 w-8 h-8 flex items-center justify-center rounded-xl shadow-md transition-all active:scale-90 ${
              watching
                ? 'bg-violet-600 text-white shadow-violet-500/40 scale-105'
                : 'bg-white/95 dark:bg-gray-900/95 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:shadow-violet-500/20'
            }`}
          >
            <Bell className={`w-4 h-4 transition-transform ${watching ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3 md:p-4 flex flex-col flex-1 gap-2">
        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-gray-800 dark:text-gray-200">{product.rating}</span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              ({product.reviews})
            </span>
          </div>
        )}

        {/* Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-[13px] md:text-[15px] leading-snug line-clamp-2 flex-1 min-h-[36px] md:min-h-[42px]">
          <Link to={href} onClick={stop} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            {product.name}
          </Link>
        </h3>

        {/* Price + best store */}
        <div className="flex items-end justify-between mt-auto pt-1">
          <div className="min-w-0 flex-1">
            {bestMarket && (
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[80px] md:max-w-none">
                  {bestMarket.source}
                </span>
                {bestMarket.url && bestMarket.url !== '#' && (
                  <a
                    href={bestMarket.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); trackStoreClick(product.id, bestMarket.source, bestMarket.price); }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
            <p className="text-[15px] md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              {formatSum(bestPrice)}
            </p>
          </div>
          
          {/* Mobile indicator icon */}
          <div className="md:hidden w-7 h-7 flex items-center justify-center bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg shrink-0 active:scale-95 transition-all">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* CTA (Desktop only) */}
        <Link
          to={href}
          onClick={stop}
          className="hidden md:flex w-full items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-black text-xs md:text-[13px] py-3 md:py-3.5 rounded-xl shadow-sm shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.98] transition-all mt-2"
        >
          {t.landing.trending.comparePrices}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
