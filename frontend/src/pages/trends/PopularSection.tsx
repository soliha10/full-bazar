import { Eye } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { productPath } from '../../utils/slug';
import type { PopularProduct } from './types';
import { ProductTile } from '../../components/product-card/ProductTile';

/* Popular products */
export function PopularSection({ popular }: { popular: PopularProduct[] }) {
  const { t } = useLanguage();
  if (popular.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.trends.mostViewed}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {popular.map((p, rank) => (
          <ProductTile key={p.id} size="sm" to={productPath(p)} name={p.name} image={p.image} price={formatSum(p.price)}
            badge={(
              <span className="flex w-5 h-5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-semibold text-white">
                {rank + 1}
              </span>
            )}
            meta={<><Eye className="w-3 h-3" aria-hidden="true" /><span className="tabular-nums">{p.viewCount}</span></>} />
        ))}
      </div>
    </section>
  );
}
