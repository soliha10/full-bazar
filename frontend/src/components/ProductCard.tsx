import { Star, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { formatSum } from '../utils/productMapper';

export interface Product {
  id: string | number;
  name: string;
  title?: string;
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
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const navigate = useNavigate();
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 p-3 flex gap-4 group hover:shadow-lg transition-all">
        <div className="relative w-32 h-32 shrink-0 bg-gray-50 rounded-xl overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />
          {discount > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-[#0062FF] text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
              TOP DEAL
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
              <span className="text-xs font-bold text-gray-900">{product.rating}</span>
              <span className="text-[10px] text-gray-400 font-medium">({product.reviews})</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
              {product.name}
            </h3>
            <p className="text-[10px] font-medium text-gray-400">Available on 8 marketplaces</p>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
               <p className="text-xs text-gray-400 font-medium leading-none mb-1">From</p>
               <p className="text-lg font-black text-gray-900 tracking-tight">{formatSum(product.price)}</p>
            </div>
            <button 
              onClick={() => navigate(`/product/${product.id}`)}
              className="p-2 bg-blue-50 text-[#0062FF] rounded-lg hover:bg-[#0062FF] hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-4xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-gray-100 group">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-700"
          />
          
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-[#0062FF] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
              TOP DEAL
            </div>
          )}
          
          {product.source && (
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[10px] text-gray-900 font-black uppercase tracking-wider">
                {product.source}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <div className="flex justify-between items-center gap-2 mb-3">
          <p className="text-xs font-bold text-[#0062FF] uppercase tracking-widest">{product.category}</p>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-[#FFC107] text-[#FFC107]" />
            <span className="text-xs font-black text-gray-900">{product.rating}</span>
            <span className="text-[10px] text-gray-400 font-bold">({product.reviews})</span>
          </div>
        </div>
        
        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-gray-900 mb-6 line-clamp-2 hover:text-[#0062FF] transition-colors text-lg leading-snug h-14">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-col mb-6">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Starting From</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 tracking-tighter">{formatSum(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through font-medium">
                {formatSum(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.id}`);
          }}
          className="group/btn flex items-center justify-center gap-2 rounded-2xl py-4 bg-[#0062FF] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <span className="font-bold tracking-tight text-white">
            Compare Prices
          </span>
          <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}