import { LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SORT_OPTIONS } from './constants';
import type { ListingFilters } from './useListingFilters';
import type { FilterActions } from './useFilterActions';
import { FilterPanel } from './FilterPanel';

/**
 * Desktopdagi chap ustun — filtrlar darhol qo'llanadi.
 *
 * Navbar `fixed` va 65px baland. Ilgari ustun `top-6` (24px) da yopishardi,
 * ya'ni sahifa aylantirilganda uning tepasidagi 41px — "Filtrlar" sarlavhasi
 * va "Tozalash" tugmasi — navbar ostida qolib ketardi. Endi ustun navbar
 * ostidan boshlanadi va balandligi ekranga sig'adi.
 */
export function DesktopSidebar({ f, actions }: { f: ListingFilters; actions: FilterActions }) {
  const { t } = useLanguage();
  const { activeFilterCount, handleResetFilters } = actions;

  return (
    <aside className="hidden w-[232px] shrink-0 lg:block">
      <div className="sticky top-[86px] max-h-[calc(100vh-102px)] overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin pr-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t.listing.filters}
            {activeFilterCount > 0 && (
              <span className="ml-1.5 text-violet-600 dark:text-violet-400">{activeFilterCount}</span>
            )}
          </h2>
          {activeFilterCount > 0 && (
            <button type="button" onClick={handleResetFilters}
              className="text-xs text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              {t.listing.reset}
            </button>
          )}
        </div>
        <FilterPanel f={f} isMobile={false} />
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
              aria-pressed={sortBy === key}
              className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                sortBy === key ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {(t.listing as any)[labelKey] ?? labelKey}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
          <button onClick={() => setViewMode('grid')}
            aria-label={t.listing.grid} aria-pressed={viewMode === 'grid'}
            className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            aria-label={t.listing.list} aria-pressed={viewMode === 'list'}
            className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
