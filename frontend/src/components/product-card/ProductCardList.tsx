import { Star, ArrowRight, TrendingDown, Heart, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';

// ── List view ──────────────────────────────────────────────────────────────
export function ProductCardList({ product, card }: { product: Product; card: ProductCardState }) {
  const { t, href, stop, liked, comparing, compareDisabled, compareTitle, sortedMarkets, bestPrice, savings } = card;
  return (
    <div
      onClick={card.open}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 flex gap-3 group hover:shadow-lg hover:shadow-violet-500/8 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-200 cursor-pointer active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative w-24 h-24 shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
        <img
          src={product.image || 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'}
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
          onClick={(e) => { e.stopPropagation(); card.toggleCompare(); }}
          title={compareTitle}
          className={`absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-lg shadow-sm transition-all active:scale-90 ${
            comparing ? 'bg-violet-600 text-white' : 'bg-white/90 dark:bg-gray-900/90 text-gray-400'
          } ${compareDisabled ? 'opacity-40' : ''}`}
        >
          <Scale className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); card.toggleLike(); }}
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-lg bg-white/90 dark:bg-gray-900/90 shadow-sm transition-all active:scale-90"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {product.rating > 0 && (
              <>
                <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-lg">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-gray-800 dark:text-gray-200">{product.rating}</span>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">({product.reviews})</span>
              </>
            )}
            {savings > 0 && (
              <span className="ml-auto flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-lg">
                <TrendingDown className="w-2.5 h-2.5" />
                -{formatSum(savings)}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
            <Link to={href} onClick={stop} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">
              {sortedMarkets.length > 0
                ? t.common.fromStores.replace('{{count}}', String(sortedMarkets.length))
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
