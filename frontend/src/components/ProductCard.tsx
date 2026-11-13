import type { Product } from './product-card/types';
import { useProductCard } from './product-card/useProductCard';
import { ProductCardList } from './product-card/ProductCardList';
import { ProductCardGrid } from './product-card/ProductCardGrid';

// Product turi ko'p sahifalarda shu fayldan import qilinadi — qayta eksport
export type { Product, ProductVariant } from './product-card/types';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  activeMarkets?: string[];
  className?: string;
  style?: React.CSSProperties;
}

/** Loyihadagi yagona mahsulot kartasi — katalog, bosh sahifa, sevimlilar bir xil ko'rinishda. */
export function ProductCard({ product, viewMode = 'grid', activeMarkets = [], className, style }: ProductCardProps) {
  const card = useProductCard(product, activeMarkets);
  if (viewMode === 'list') return <ProductCardList product={product} card={card} />;
  return <ProductCardGrid product={product} card={card} className={className} style={style} />;
}
