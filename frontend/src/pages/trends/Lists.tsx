import { Link } from 'react-router-dom';
import { Search, TrendingDown, TrendingUp } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { productPath } from '../../utils/slug';
import type { SearchTrend, PriceItem } from './types';
import { DivergingBars, type DivergingItem } from '../../components/charts/DivergingBars';
import { Card } from "../../components/Card";

// Chip o'lchami — qidiruv soniga qarab 4 pog'ona (sequential: bitta rang, kattalik)
const SIZES = [
  'px-3 py-1.5 text-xs',
  'px-3.5 py-1.5 text-sm',
  'px-4 py-2 text-[15px]',
  'px-5 py-2.5 text-base',
];

/* Search trends — mashhurlik chip kattaligi bilan; eng yuqori 3 tasi raqamli */
export function SearchTrendsSection({ searchTrends }: { searchTrends: SearchTrend[] }) {
  const { t } = useLanguage();
  const max = Math.max(...searchTrends.map(s => s.count), 1);
  return (
    <section aria-labelledby="top-searches">
      <h2 id="top-searches" className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t.trends.topSearches}</h2>
      {searchTrends.length === 0 ? (
        <Card className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl glass-soft">
            <Search className="w-4 h-4" aria-hidden="true" />
          </span>
          {t.trends.noSearchData}
        </Card>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {searchTrends.map((item, rank) => {
            const level = Math.min(SIZES.length - 1, Math.floor((item.count / max) * SIZES.length));
            const tip = t.trends.searchedTimes.replace('{{count}}', String(item.count));
            return (
              <Link key={item.query} to={`/products?search=${encodeURIComponent(item.query)}`} data-tip={tip}
                className={`group inline-flex items-center gap-2 rounded-full glass-soft font-medium text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors ${SIZES[level]}`}>
                {rank < 3 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-fuchsia-500 text-[10px] font-semibold text-white">
                    {rank + 1}
                  </span>
                )}
                {item.query}
                <span className="text-[11px] tabular-nums text-gray-400 group-hover:text-violet-500">{item.count}</span>
              </Link>
            );
          })}
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
      <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="price-changes" className="text-base font-semibold text-gray-900 dark:text-white">{t.trends.priceChanges}</h2>
        {/* Holat — doim ikonka + matn bilan, faqat rangga tayanilmaydi */}
        {dropping.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />{t.trends.droppedCount.replace('{{count}}', String(dropping.length))}
          </span>
        )}
        {rising.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-300">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />{t.trends.risenCount.replace('{{count}}', String(rising.length))}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.trends.priceChangesHint}</p>
      <Card padding="none" className="px-4 py-3">
        {items.length === 0
          ? <p className="py-6 text-sm text-gray-400 text-center">{t.trends.noData}</p>
          : <DivergingBars items={items} negLabel={t.trends.priceDropped} posLabel={t.trends.priceIncreased} />}
      </Card>
    </section>
  );
}
