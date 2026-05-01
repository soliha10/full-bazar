import { Star, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatSum } from '../utils/productMapper';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();

  const sortedMarkets = [...(product.markets ?? [])].sort((a, b) => a.price - b.price);
  const bestPrice = sortedMarkets[0]?.price ?? product.price;

  // ── List view ──────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-4 group hover:shadow-lg transition-all">
        <Link
          to={`/product/${product.id}`}
          className="relative w-28 h-28 shrink-0 bg-gray-50 rounded-xl overflow-hidden"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-xs font-black text-gray-900">{product.rating}</span>
              <span className="text-[10px] text-gray-400">({product.reviews})</span>
            </div>
            <Link to={`/product/${product.id}`}>
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight hover:text-[#0062FF] transition-colors">
                {product.name}
              </h3>
            </Link>
          </div>

          {/* market prices row */}
          {sortedMarkets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sortedMarkets.slice(0, 3).map((m, idx) => (
                <span
                  key={m.source}
                  className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                    idx === 0
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {idx === 0 && <span>✓</span>}
                  {m.source} · {formatSum(m.price)}
                </span>
              ))}
              {sortedMarkets.length > 3 && (
                <span className="text-[10px] text-[#0062FF] font-bold self-center">
                  +{sortedMarkets.length - 3} →
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">
                {t.listing.startingFrom}
              </p>
              <p className="text-base font-black text-gray-900 tracking-tight">{formatSum(bestPrice)}</p>
            </div>
            <button
              onClick={() => navigate(`/product/${product.id}`)}
              className="p-2 bg-blue-50 text-[#0062FF] rounded-xl hover:bg-[#0062FF] hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400 border border-gray-100 group flex flex-col">
      {/* image */}
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-50 block">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-7 group-hover:scale-108 transition-transform duration-600 mix-blend-multiply"
        />
        {sortedMarkets.length > 1 && (
          <div className="absolute top-3 left-3 bg-[#0062FF] text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wide">
            {sortedMarkets.length} DO'KON
          </div>
        )}
        {product.source && (
          <div className="absolute top-3 right-3 bg-white/85 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[9px] text-gray-800 font-black uppercase tracking-wider">
              {product.source}
            </span>
          </div>
        )}
      </Link>

      {/* body */}
      <div className="p-4 flex flex-col flex-1">
        {/* rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-0.5 rounded-lg">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-black text-gray-800">{product.rating}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">({product.reviews} sharh)</span>
        </div>

        {/* name */}
        <Link to={`/product/${product.id}`} className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#0062FF] transition-colors mb-3 min-h-10">
            {product.name}
          </h3>
        </Link>

        {/* market price comparison */}
        {sortedMarkets.length > 0 ? (
          <div className="space-y-1.5 mb-4">
            {sortedMarkets.slice(0, 3).map((m, idx) => (
              <div
                key={m.source}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  idx === 0 ? 'bg-green-50 ring-1 ring-green-100' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {idx === 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wide ${
                      idx === 0 ? 'text-green-700' : 'text-gray-400'
                    }`}
                  >
                    {m.source}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-black ${
                      idx === 0 ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {formatSum(m.price)}
                  </span>
                  {m.url && m.url !== '#' && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-300 hover:text-[#0062FF] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {sortedMarkets.length > 3 && (
              <p className="text-[10px] text-[#0062FF] font-bold text-right px-1">
                +{sortedMarkets.length - 3} ta boshqa narx →
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
              {t.listing.startingFrom}
            </p>
            <p className="text-lg font-black text-gray-900 tracking-tight">{formatSum(product.price)}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-[#0062FF] hover:bg-blue-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95 transition-all"
        >
          {t.landing.trending.comparePrices}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
