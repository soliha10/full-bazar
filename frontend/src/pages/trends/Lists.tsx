import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Search, Flame } from 'lucide-react';
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
        <Search className="w-4 h-4 text-violet-500" />
        <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.topSearches}</h2>
      </div>
      {searchTrends.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{t.trends.noSearchData}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {searchTrends.map((tItem, i) => (
            <Link
              key={tItem.query}
              to={`/products?search=${encodeURIComponent(tItem.query)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all
                bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700
                hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20
                hover:text-violet-700 dark:hover:text-violet-300 group"
            >
              {i < 3 && <Flame className="w-3 h-3 text-orange-500 shrink-0" />}
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                {tItem.query}
              </span>
              <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                {tItem.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* Price changes */
export function PriceChanges({ dropping, rising }: { dropping: PriceItem[]; rising: PriceItem[] }) {
  const { t } = useLanguage();
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-4 h-4 text-violet-500" />
        <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.priceChanges}</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">

        {/* Dropping */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-emerald-50 dark:bg-emerald-950/30">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{t.trends.priceDropped}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {dropping.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">{t.trends.noData}</p>
            ) : dropping.map(item => (
              <Link
                key={item.id}
                to={productPath(item)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatSum(item.price)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-emerald-600">{formatSum(Math.abs(item.priceChange))}</p>
                  <p className="text-[10px] font-bold text-emerald-500">{Math.abs(item.pctChange)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Rising */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-rose-50 dark:bg-rose-950/30">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span className="text-sm font-black text-rose-700 dark:text-rose-400">{t.trends.priceIncreased}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {rising.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">{t.trends.noData}</p>
            ) : rising.map(item => (
              <Link
                key={item.id}
                to={productPath(item)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatSum(item.price)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-rose-600">+{formatSum(item.priceChange)}</p>
                  <p className="text-[10px] font-bold text-rose-500">+{item.pctChange}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
