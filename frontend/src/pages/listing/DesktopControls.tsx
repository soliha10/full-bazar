import { LayoutGrid, List, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SORT_OPTIONS } from './constants';
import type { ListingFilters } from './useListingFilters';
import type { FilterActions } from './useFilterActions';
import { FilterPanel } from './FilterPanel';

/** Desktopdagi chap ustun — filtrlar darhol qo'llanadi. */
export function DesktopSidebar({ f, actions }: { f: ListingFilters; actions: FilterActions }) {
  const { t } = useLanguage();
  const { activeFilterCount, handleResetFilters } = actions;

  return (
    <aside className="hidden w-[220px] shrink-0 lg:block">
      <div
        className="sticky top-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            {t.listing.filters}
            {activeFilterCount > 0 && (
              <span className="ml-0.5 rounded-full bg-violet-600 px-1.5 text-[10px] font-black text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> {t.listing.reset}
            </button>
          )}
        </div>
        <div className="px-3 pb-4">
          <FilterPanel f={f} isMobile={false} />
        </div>
      </div>
    </aside>
  );
}

/** Desktop asboblar paneli: jami soni, saralash va ko'rinish rejimi. */
export function DesktopToolbar({ f, total, showCount }: { f: ListingFilters; total: number; showCount: boolean }) {
  const { t } = useLanguage();
  const { sortBy, setSortBy, viewMode, setViewMode } = f;

  return (
    <div className="hidden md:flex items-center justify-between mb-4">
      <p className="text-[13px] text-gray-500 dark:text-gray-400">
        {!showCount ? '...' : (
          <span>{t.listing.totalProductsCount.replace('{{count}}', total.toLocaleString())}</span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
          {SORT_OPTIONS.map(({ key, labelKey }) => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                sortBy === key ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {(t.listing as any)[labelKey] ?? labelKey}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
          <button onClick={() => setViewMode('grid')}
            className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
