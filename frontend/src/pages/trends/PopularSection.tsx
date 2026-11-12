import { Link } from 'react-router-dom';
import { Eye, ShoppingBag } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { productPath } from '../../utils/slug';
import type { PopularProduct } from './types';

/* Popular products */
export function PopularSection({ popular }: { popular: PopularProduct[] }) {
  const { t } = useLanguage();
  if (popular.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-violet-500" />
        <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.mostViewed}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {popular.map((p, rank) => (
          <Link
            key={p.id}
            to={productPath(p)}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800
              hover:border-violet-300 dark:hover:border-violet-700
              hover:shadow-md hover:shadow-violet-500/10
              transition-all group overflow-hidden"
          >
            <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">
                {rank + 1}
              </span>
            </div>
            <div className="p-3">
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {p.name}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs font-black text-violet-600 dark:text-violet-400">{formatSum(p.price)}</p>
                <div className="flex items-center gap-0.5 text-gray-400">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{p.viewCount}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
