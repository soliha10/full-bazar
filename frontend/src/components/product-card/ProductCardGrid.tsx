import { Heart, Bell, Scale } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { StoreLogo } from '../StoreLogo';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';
import { ProductTile, TileAction } from './ProductTile';

/** Katalog kartasi uchun narx ostidagi qator: eng arzon do'kon, do'konlar soni, tejash */
export function CatalogMeta({ card }: { card: ProductCardState }) {
  const { t, sortedMarkets, savings, bestMarket } = card;
  const stores = sortedMarkets.length;
  return (
    <>
      {bestMarket && <StoreLogo name={bestMarket.source} size="xs" />}
      <span className="truncate">
        {stores > 1 ? t.common.fromStores.replace('{{count}}', String(stores)) : bestMarket?.source}
        {savings > 0 && <span className="text-emerald-600 dark:text-emerald-400"> · −{formatSum(savings)}</span>}
      </span>
    </>
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
// Minimal karta: rasm, nom, narx va bitta izoh qatori. Butun karta — havola.
export function ProductCardGrid({ product, card }: { product: Product; card: ProductCardState }) {
  return (
    <ProductTile to={card.href} name={product.name} image={product.image}
      price={formatSum(card.bestPrice)} meta={<CatalogMeta card={card} />}
      actions={<CatalogActions card={card} />} />
  );
}
