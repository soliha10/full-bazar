import { Eye } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { productPath } from '../../utils/slug';
import type { PopularProduct } from './types';
import { ProductTile } from '../../components/product-card/ProductTile';
import { ProductGrid } from '../../components/product-card/ProductGrid';
import { fullRowsClass } from '../../components/layout';

// Eng ko'p ko'rilgan 3 tasi — podium belgisi
const PODIUM = 3;

function Rank({ n, big }: { n: number; big?: boolean }) {
  return (
    <span className={`flex items-center justify-center rounded-full font-semibold text-white tabular-nums shadow-md ${
      big ? 'h-8 min-w-8 px-2 text-sm bg-linear-to-br from-violet-600 to-fuchsia-500 shadow-violet-500/30' : 'h-5 w-5 text-[10px] bg-violet-600'}`}>
      {big ? `№${n}` : n}
    </span>
  );
}

/* Popular products — so'nggi 7 kundagi ko'rishlar soni bo'yicha */
export function PopularSection({ popular }: { popular: PopularProduct[] }) {
  const { t } = useLanguage();
  if (popular.length === 0) return null;
  const views = (p: PopularProduct) => (
    <span className="inline-flex items-center gap-1" data-tip={t.trends.viewsCount.replace('{{count}}', String(p.viewCount))}>
      <Eye className="w-3 h-3" aria-hidden="true" /><span className="tabular-nums">{p.viewCount}</span>
    </span>
  );
  return (
    <section aria-labelledby="most-viewed">
      <h2 id="most-viewed" className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t.trends.mostViewed}</h2>
      {/* Katalogdagi setka va karta o'lchami; eng yuqori 3 tasi — gradientli № belgisi */}
      <ProductGrid>
        {popular.map((p, i) => (
          // Har ustun sonida faqat to'liq qatorlar (layout.ts)
          <div key={p.id} className={fullRowsClass(i, popular.length)}>
            <ProductTile to={productPath(p)} name={p.name} image={p.image} price={formatSum(p.price)}
              badge={<Rank n={i + 1} big={i < PODIUM} />} meta={views(p)} />
          </div>
        ))}
      </ProductGrid>
    </section>
  );
}
