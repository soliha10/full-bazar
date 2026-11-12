import { Heart, Bell, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import { StoreLogo } from '../StoreLogo';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';

const PLACEHOLDER = 'https://placehold.co/400x400/f9fafb/9ca3af?text=📱';

/** Kartadagi kichik amal tugmasi (solishtirish, sevimli, kuzatuv) */
function CardAction({ on, title, onClick, disabled, children }: {
  on: boolean; title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title} aria-pressed={on}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
        on ? 'bg-violet-600 text-white' : 'glass-soft text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
      } ${disabled ? 'opacity-40' : ''}`}>
      {children}
    </button>
  );
}

// ── Grid view ──────────────────────────────────────────────────────────────
// Minimal karta: rasm, nom, narx va bitta izoh qatori. Ilgari har kartada
// katta binafsha "Narxlarni solishtirish" tugmasi, do'kon/tejash nishonlari
// va bir nechta bezak ikonka bor edi — 20 ta kartada ular narxdan ko'ra
// ko'proq ko'zga tashlanardi. Butun karta — havola.
export function ProductCardGrid({ product, card }: { product: Product; card: ProductCardState }) {
  const {
    t, user, href, stop, liked, watching, comparing, compareDisabled, compareTitle,
    sortedMarkets, bestPrice, savings, bestMarket,
  } = card;
  const stores = sortedMarkets.length;

  return (
    <div
      onClick={card.open}
      className="group glass glass-hover rounded-2xl overflow-hidden flex flex-col cursor-pointer h-full"
    >
      <div className="relative aspect-square m-1.5 rounded-xl bg-white dark:bg-white/[0.04]">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          className="w-full h-full object-contain p-5 mix-blend-multiply dark:mix-blend-normal"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <CardAction on={comparing} title={compareTitle} onClick={card.toggleCompare} disabled={compareDisabled}>
            <Scale className="w-4 h-4" />
          </CardAction>
          <CardAction on={liked} title={t.footer.wishlist} onClick={card.toggleLike}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </CardAction>
          {user && (
            <CardAction on={watching} title={watching ? t.common.watchRemove : t.common.watchAdd} onClick={card.toggleWatch}>
              <Bell className="w-4 h-4" />
            </CardAction>
          )}
        </div>
      </div>

      <div className="px-3 pb-3 pt-1.5 md:px-4 md:pb-4 flex flex-col flex-1 gap-1.5">
        <h3 className="text-sm md:text-[15px] font-medium text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[38px] md:min-h-[42px]">
          <Link to={href} onClick={stop} className="hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto pt-1">
          <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {formatSum(bestPrice)}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
            {bestMarket && <StoreLogo name={bestMarket.source} size="xs" />}
            {stores > 1
              ? t.common.fromStores.replace('{{count}}', String(stores))
              : bestMarket?.source}
            {savings > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400"> · −{formatSum(savings)}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
