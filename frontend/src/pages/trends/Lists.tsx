import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { productPath } from '../../utils/slug';
import type { SearchTrend, PriceItem } from './types';
import { DivergingBars, type DivergingItem } from '../../components/charts/DivergingBars';

/* Search trends */
export function SearchTrendsSection({ searchTrends }: { searchTrends: SearchTrend[] }) {
  const { t } = useLanguage();
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.trends.topSearches}</h2>
      </div>
      {searchTrends.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{t.trends.noSearchData}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {searchTrends.map((tItem) => (
            <Link
              key={tItem.query}
              to={`/products?search=${encodeURIComponent(tItem.query)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all
                bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700
                hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20
                hover:text-violet-700 dark:hover:text-violet-300 group"
            >
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                {tItem.query}
              </span>
              <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                {tItem.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* Price changes — bitta diverging grafik: chapda arzonlashganlar, o'ngda qimmatlashganlar.
   Modelning eng arzon narxi 7 kun oldingi bilan (python/fastapi_app/trends_api.py) */
export function PriceChanges({ dropping, rising }: { dropping: PriceItem[]; rising: PriceItem[] }) {
  const { t } = useLanguage();
  const items: DivergingItem[] = [...dropping, ...rising]
    .map(item => {
      // oldPrice — yangi API; deploy paytidagi bir daqiqalik oraliqda eski javob ham ishlasin
      const old = item.oldPrice ?? item.price - item.priceChange;
      return {
        id: item.id, label: item.name, value: item.pctChange, href: productPath(item),
        valueText: `${item.pctChange > 0 ? '+' : '−'}${Math.abs(item.pctChange).toFixed(1)}%`,
        sub: `${formatSum(old)} → ${formatSum(item.price)}`,
      };
    })
    .sort((a, b) => a.value - b.value);

  return (
    <section aria-labelledby="price-changes">
      <h2 id="price-changes" className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t.trends.priceChanges}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.trends.priceChangesHint}</p>
      <div className="glass rounded-2xl px-4 py-3">
        {items.length === 0
          ? <p className="py-6 text-sm text-gray-400 text-center">{t.trends.noData}</p>
          : <DivergingBars items={items} negLabel={t.trends.priceDropped} posLabel={t.trends.priceIncreased} />}
      </div>
    </section>
  );
}
