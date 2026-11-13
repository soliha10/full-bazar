import { formatSum } from '../../utils/productMapper';
import { memoryFromName, nameWithoutMemory } from '../../utils/memoryFromName';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';
import { ProductTile } from './ProductTile';
import { CatalogActions, CatalogMeta, MemoryChips, SavingsBadge } from './ProductCardGrid';

// ── List view ──────────────────────────────────────────────────────────────
// Setka kartasining o'zi, faqat qator ko'rinishida (ProductTile layout="row").
export function ProductCardList({ product, card }: { product: Product; card: ProductCardState }) {
  return (
    <ProductTile layout="row" to={card.href} name={product.name} shortName={memoryFromName(product.name).storage ? nameWithoutMemory(product.name) : undefined} image={product.image}
      badge={<SavingsBadge card={card} />} price={formatSum(card.bestPrice)} meta={<CatalogMeta card={card} />}
      chips={<MemoryChips name={product.name} card={card} />} actions={<CatalogActions card={card} withWatch={false} />} />
  );
}
