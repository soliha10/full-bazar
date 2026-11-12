import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { ProductCard, type Product } from '../../components/ProductCard';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  total: number;
  refetch: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  viewMode: 'grid' | 'list';
  selectedMarketplaces: string[];
  searchQuery: string;
  activeFilterCount: number;
  onClearSearch: () => void;
  onResetFilters: () => void;
}

/** Mahsulotlar to'ri/ro'yxati va uning yuklanish, xato, bo'sh holatlari. */
export function ProductResults(props: Props) {
  const { t } = useLanguage();
  const { products: filteredProducts, viewMode, selectedMarketplaces, searchQuery, activeFilterCount } = props;

  return (
    <>
      {/* Products grid/list */}
      {props.isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
          </div>
          <p className="text-sm text-gray-400">{t.common.loading}</p>
        </div>
      ) : props.isError && filteredProducts.length === 0 ? (
        // So'rov xato bo'lsa "topilmadi" deyish noto'g'ri — mahsulot bor,
        // faqat server javob bermadi. Shuning uchun alohida xabar va
        // qayta urinish tugmasi.
        <div role="alert" className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">{t.listing.loadErrorTitle}</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">{t.listing.loadErrorDesc}</p>
          <button
            onClick={props.refetch}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.listing.retry}
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
            {searchQuery ? t.listing.noResultsFor.replace('{{query}}', searchQuery) : t.listing.noProductsFound}
          </h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            {searchQuery ? t.listing.noResultsForDesc : t.listing.noProductsDesc}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {searchQuery && (
              <button
                onClick={props.onClearSearch}
                className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-400 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <X className="w-3.5 h-3.5" /> {t.listing.clearSearch}
              </button>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={props.onResetFilters}
                className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t.listing.resetFilters}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 md:gap-4">
              {filteredProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: Math.min(i, 15) * 0.045 }}
                >
                  <ProductCard product={p} activeMarkets={selectedMarketplaces} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(i, 15) * 0.04 }}
                >
                  <ProductCard product={p} viewMode="list" activeMarkets={selectedMarketplaces} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Infinite scroll sentinel — always mounted so observer fires on first load */}
      <div ref={props.sentinelRef} className="mt-8 flex items-center justify-center h-10">
        {props.isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span>{t.common.loading}</span>
          </div>
        )}
        {!props.hasMore && filteredProducts.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-600">
            {t.listing.shownProducts.replace('{{count}}', props.total.toLocaleString())}
          </p>
        )}
      </div>
    </>
  );
}
