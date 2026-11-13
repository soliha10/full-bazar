import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { productPath } from '../../utils/slug';
import type { SearchTrend, PriceItem } from './types';

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

/** Bitta qator: nomi, eski → yangi narx, ishorali o'zgarish (rang + belgi, faqat rang emas). */
function ChangeRow({ item, down }: { item: PriceItem; down: boolean }) {
  const tone = down ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  return (
    <Link to={productPath(item)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900/[0.03] dark:hover:bg-white/[0.04] transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300">
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {/* oldPrice — yangi API; deploy paytidagi bir daqiqalik oraliqda eski javob ham ishlasin */}
          <span className="line-through">{formatSum(item.oldPrice ?? item.price - item.priceChange)}</span>
          <span aria-hidden="true"> → </span>
          <span className="text-gray-900 dark:text-white font-medium">{formatSum(item.price)}</span>
        </p>
      </div>
      <div className={`text-right shrink-0 tabular-nums ${tone}`}>
        <p className="text-sm font-semibold">{down ? '−' : '+'}{Math.abs(item.pctChange).toFixed(1)}%</p>
        <p className="text-xs">{down ? '−' : '+'}{formatSum(Math.abs(item.priceChange))}</p>
      </div>
    </Link>
  );
}

function ChangeList({ title, items, down, empty }: { title: string; items: PriceItem[]; down: boolean; empty: string }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <h3 className="flex items-center gap-2 px-4 py-3 border-b border-gray-900/5 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white">
        <span aria-hidden="true" className={`text-base leading-none ${down ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {down ? '↓' : '↑'}
        </span>
        {title}
      </h3>
      <div className="divide-y divide-gray-900/5 dark:divide-white/5">
        {items.length === 0
          ? <p className="px-4 py-6 text-sm text-gray-400 text-center">{empty}</p>
          : items.map(item => <ChangeRow key={item.id} item={item} down={down} />)}
      </div>
    </div>
  );
}

/* Price changes — modelning eng arzon narxi, 7 kun oldingi bilan (python/fastapi_app/trends_api.py) */
export function PriceChanges({ dropping, rising }: { dropping: PriceItem[]; rising: PriceItem[] }) {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="price-changes">
      <h2 id="price-changes" className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t.trends.priceChanges}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.trends.priceChangesHint}</p>
      <div className="grid md:grid-cols-2 gap-4">
        <ChangeList title={t.trends.priceDropped} items={dropping} down empty={t.trends.noData} />
        <ChangeList title={t.trends.priceIncreased} items={rising} down={false} empty={t.trends.noData} />
      </div>
    </section>
  );
}
