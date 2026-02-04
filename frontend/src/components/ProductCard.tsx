import { Star, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';

export interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  inStock: boolean;
  description?: string;
  source?: string;
  url?: string;
  markets?: Array<{
    source: string;
    price: number;
    url: string;
  }>;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useLanguage();
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border group">
      <Link to={`/product/${product.id}`}>
        <div className="relative h-64 overflow-hidden bg-muted">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-[#2ECC71] text-white px-2 py-1 rounded-md text-sm font-semibold">
              {discount}% {t.product.off}
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">{t.product.outOfStock}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-[#FF7A00] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#FF7A00] text-[#FF7A00]" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews} {t.product.reviews})</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">{formatSum(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatSum(product.originalPrice)}</span>
            )}
          </div>
          {product.source && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground uppercase tracking-wider font-bold">
              {product.source}
            </span>
          )}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className="flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.inStock ? t.product.addToCart : t.product.outOfStock}
        </Button>
      </div>
    </div>
  );
}