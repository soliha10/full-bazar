import { formatSum } from '../../utils/productMapper';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';
import { ProductTile } from './ProductTile';
import { CatalogActions, CatalogMeta, SavingsBadge } from './ProductCardGrid';

// ── List view ──────────────────────────────────────────────────────────────
// Setka kartasining o'zi, faqat qator ko'rinishida (ProductTile layout="row").
export function ProductCardList({ product, card }: { product: Product; card: ProductCardState }) {
  return (
    <ProductTile layout="row" to={card.href} name={product.name} image={product.image}
      badge={<SavingsBadge card={card} />} price={formatSum(card.bestPrice)} meta={<CatalogMeta card={card} />}
      actions={<CatalogActions card={card} withWatch={false} />} />
  );
}
