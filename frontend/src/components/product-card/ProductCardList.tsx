import { Heart, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import { StoreLogo } from '../StoreLogo';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';

const PLACEHOLDER = 'https://placehold.co/200x200/f9fafb/9ca3af?text=📱';

// ── List view ──────────────────────────────────────────────────────────────
// Grid kartasi bilan bir xil minimal uslub: nom, narx, bitta izoh qatori.
export function ProductCardList({ product, card }: { product: Product; card: ProductCardState }) {
  const { t, href, stop, liked, comparing, compareDisabled, compareTitle, sortedMarkets, bestPrice, savings, bestMarket } = card;
  const stores = sortedMarkets.length;
  const action = (on: boolean) =>
    `w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
      on ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <div
      onClick={card.open}
      className="glass glass-hover rounded-2xl p-3 flex items-center gap-4 cursor-pointer"
    >
      <div className="w-20 h-20 shrink-0 bg-white dark:bg-white/[0.04] rounded-xl overflow-hidden">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          className="w-full h-full object-contain p-2 mix-blend-multiply dark:mix-blend-normal"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
          <Link to={href} onClick={stop} className="hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
          {bestMarket && <StoreLogo name={bestMarket.source} size="xs" />}
          {stores > 1 ? t.common.fromStores.replace('{{count}}', String(stores)) : bestMarket?.source}
          {savings > 0 && <span className="text-emerald-600 dark:text-emerald-400"> · −{formatSum(savings)}</span>}
        </p>
      </div>

      <p className="text-base font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
        {formatSum(bestPrice)}
      </p>

      <div className="flex flex-col gap-1 shrink-0">
        <button type="button" title={compareTitle} aria-label={compareTitle} aria-pressed={comparing}
          onClick={(e) => { e.stopPropagation(); card.toggleCompare(); }}
          className={`${action(comparing)} ${compareDisabled ? 'opacity-40' : ''}`}>
          <Scale className="w-4 h-4" />
        </button>
        <button type="button" title={t.footer.wishlist} aria-label={t.footer.wishlist} aria-pressed={liked}
          onClick={(e) => { e.stopPropagation(); card.toggleLike(); }}
          className={action(liked)}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
