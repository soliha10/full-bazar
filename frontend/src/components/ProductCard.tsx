import { Star, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  images?: string[];
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
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-card rounded-4xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-border/50 group">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-4/5 overflow-hidden bg-muted">
          <img 
            src={product.image} 
            alt={product.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('placeholder')) {
                target.src = 'https://via.placeholder.com/600x600?text=Rasm+mavjud+emas';
              }
            }}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
              {discount}% {t.product.off}
            </div>
          )}
          
          {product.source && (
            <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
              <span className="text-[10px] text-foreground font-bold uppercase tracking-wider">
                {product.source}
              </span>
            </div>
          )}
          
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <span className="text-foreground font-bold text-lg px-6 py-2 border-2 border-foreground rounded-full">
                {t.product.outOfStock}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <Link to={`/product/${product.id}`}>
          <div className="flex justify-between items-start gap-2 mb-2">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">{product.category}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="text-xs font-bold">{product.rating}</span>
            </div>
          </div>
          <h3 className="font-bold text-foreground mb-4 line-clamp-2 hover:text-primary transition-colors text-lg leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.listing.startingFrom}</span>
            <span className="text-2xl font-black text-foreground tracking-tight">{formatSum(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through decoration-primary/30 decoration-2">
                {formatSum(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.id}`);
          }}
          className="flex items-center justify-center gap-3 rounded-2xl py-4"
        >
          <Eye className="w-5 h-5" />
          <span className="font-bold tracking-wide uppercase">
            {t.listing.comparePrices}
          </span>
        </Button>
      </div>
    </div>
  );
}