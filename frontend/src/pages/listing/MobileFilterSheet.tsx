import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ListingFilters } from './useListingFilters';
import type { FilterActions } from './useFilterActions';
import { FilterPanel } from './FilterPanel';

/**
 * Mobil filtr oynasi (pastdan chiqadi). Chapda tablar — har birining tagida
 * qoralamadagi joriy qiymat, o'ngda tanlangan tab mazmuni.
 */
export function MobileFilterSheet({ f, actions }: { f: ListingFilters; actions: FilterActions }) {
  const { t } = useLanguage();
  const { isMobileFilterOpen, setIsMobileFilterOpen, activeFilterTab, setActiveFilterTab,
    draftMinPrice, draftMaxPrice, draftBrand, draftMarketplaces, draftRating, draftRam, draftStorage, draftBattery } = f;
  const { activeFilterCount, brandLabel, handleResetFilters, handleApplyMobileFilters } = actions;

  return (
    <AnimatePresence>
    {isMobileFilterOpen && (
      <motion.div
        className="fixed inset-0 z-[60] md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <button
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileFilterOpen(false)}
        />

        {/* Sheet */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[80vh] max-h-[92vh] bg-white dark:bg-gray-950 flex flex-col overflow-hidden"
          style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.listing.filters}</span>
              {activeFilterCount > 0 && (
                <span className="text-sm text-violet-600 dark:text-violet-400">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-8 h-8 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            >
              <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content: Split tabbed layout */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-50 dark:bg-gray-900/50">
            {/* Left Tabs Column */}
            <div className="w-[38%] shrink-0 border-r border-gray-100/80 dark:border-gray-800/80 bg-white dark:bg-gray-950 overflow-y-auto flex flex-col divide-y divide-gray-100/50 dark:divide-gray-900/50">
              {([
                { key: 'price'    as const, label: t.listing.priceRange },
                { key: 'brand'    as const, label: t.listing.brands },
                { key: 'store'    as const, label: t.listing.stores },
                { key: 'specs'    as const, label: 'Xususiyatlar' },
                { key: 'rating'   as const, label: t.listing.rating },
              ] as const).map(tab => {
                const active = activeFilterTab === tab.key;
                // Compute subtitle
                const allLabel = t.listing.allOption;
                let sub = allLabel;
                if (tab.key === 'price') {
                  if (draftMinPrice || draftMaxPrice) sub = `${draftMinPrice || '0'}-${draftMaxPrice || '∞'}`;
                }
                else if (tab.key === 'brand') sub = draftBrand ? brandLabel(draftBrand) : allLabel;
                else if (tab.key === 'store') sub = draftMarketplaces.length > 0 ? t.listing.storesSelected.replace('{{count}}', String(draftMarketplaces.length)) : allLabel;
                else if (tab.key === 'rating') sub = draftRating > 0 ? `★ ${draftRating}+` : allLabel;
                else if (tab.key === 'specs') {
                  const n = draftRam.length + draftStorage.length + (draftBattery > 0 ? 1 : 0);
                  sub = n > 0 ? `${n} ta` : allLabel;
                }

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilterTab(tab.key)}
                    className={`flex flex-col items-start w-full px-4 py-3.5 text-left transition-all ${
                      active
                        ? 'border-l-4 border-violet-600 bg-violet-50/45 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 font-bold'
                        : 'border-l-4 border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-900/30'
                    }`}
                  >
                    <span className="text-[12px] uppercase tracking-wider font-extrabold leading-none">{tab.label}</span>
                    <span className={`text-[10px] truncate max-w-full mt-1.5 ${
                      active ? 'text-violet-500 font-semibold' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Tab Content Column */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 dark:bg-gray-900/20">
              <FilterPanel f={f} isMobile={true} mobileTab={activeFilterTab} />
            </div>
          </div>

          {/* Footer actions */}
          <div
            className="relative z-20 mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handleResetFilters}
              className="rounded-xl border border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              {t.listing.reset}
            </button>
            <button
              onClick={handleApplyMobileFilters}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 py-3 text-sm font-medium text-white transition-colors"
            >
              {t.listing.viewResults}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>
  );
}
