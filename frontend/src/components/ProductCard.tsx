import type { Product } from './product-card/types';
import { useProductCard } from './product-card/useProductCard';
import { ProductCardList } from './product-card/ProductCardList';
import { ProductCardGrid } from './product-card/ProductCardGrid';

// Product turi ko'p sahifalarda shu fayldan import qilinadi — qayta eksport
export type { Product } from './product-card/types';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  activeMarkets?: string[];
}

export function ProductCard({ product, viewMode = 'grid', activeMarkets = [] }: ProductCardProps) {
  const card = useProductCard(product, activeMarkets);
  if (viewMode === 'list') return <ProductCardList product={product} card={card} />;
  return <ProductCardGrid product={product} card={card} />;
}
