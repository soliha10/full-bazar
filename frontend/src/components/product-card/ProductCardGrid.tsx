import { Heart, Bell, Scale } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { StoreLogo } from '../StoreLogo';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';
import { ProductTile, TileAction } from './ProductTile';

/** Narx ostidagi qator: eng arzon do'kon (logo + nom) va do'konlar soni */
export function CatalogMeta({ card }: { card: ProductCardState }) {
  const { t, sortedMarkets, bestMarket } = card;
  const stores = sortedMarkets.length;
  if (!bestMarket) return null;
  return (
    <>
      <StoreLogo name={bestMarket.source} size="xs" />
      <span className="truncate">
        {bestMarket.source}
        {stores > 1 && <span className="text-gray-400 dark:text-gray-500"> · {t.home.storesTag.replace('{{count}}', String(stores))}</span>}
      </span>
    </>
  );
}

/** Tejash belgisi: do'konlar orasidagi farq foizi; to'liq izoh — data-tip */
export function SavingsBadge({ card }: { card: ProductCardState }) {
  const { t, savings, savingsPct } = card;
  if (savingsPct < 1) return null;
  const tip = t.common.savingsTip.replace('{{amount}}', formatSum(savings)).replace('{{pct}}', String(savingsPct));
  return (
    <span data-tip={tip} aria-label={tip}
      className="relative z-10 inline-flex cursor-default rounded-full bg-emerald-500/95 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
      −{savingsPct}%
    </span>
  );
}

/** Katalog kartasi amallari: solishtirish, sevimli, (kirgan bo'lsa) narx kuzatuvi */
export function CatalogActions({ card, withWatch = true }: { card: ProductCardState; withWatch?: boolean }) {
  const { t, user, liked, watching, comparing, compareDisabled, compareTitle } = card;
  return (
    <>
      <TileAction on={comparing} label={compareTitle} onClick={card.toggleCompare} disabled={compareDisabled}>
        <Scale className="w-4 h-4" />
      </TileAction>
      <TileAction on={liked} label={t.footer.wishlist} onClick={card.toggleLike}>
        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      </TileAction>
      {withWatch && user && (
        <TileAction on={watching} label={watching ? t.common.watchRemove : t.common.watchAdd} onClick={card.toggleWatch}>
          <Bell className="w-4 h-4" />
        </TileAction>
      )}
    </>
  );
}

// ── Grid view ──────────────────────────────────────────────────────────────
// Loyihadagi yagona mahsulot kartasi (katalog, bosh sahifa, sevimlilar):
// rasm + amallar, tejash belgisi, nom, eng arzon narx, do'kon va do'konlar soni.
export function ProductCardGrid({ product, card, className, style }: {
  product: Product; card: ProductCardState; className?: string; style?: React.CSSProperties;
}) {
  return (
    <ProductTile to={card.href} name={product.name} image={product.image} className={className} style={style}
      badge={<SavingsBadge card={card} />} price={formatSum(card.bestPrice)} meta={<CatalogMeta card={card} />}
      actions={<CatalogActions card={card} />} />
  );
}
