import { LayoutGrid, List, ArrowLeft } from 'lucide-react';
import { SearchBox } from '../../components/search/SearchBox';
import { useLanguage } from '../../contexts/LanguageContext';
import { SORT_OPTIONS } from './constants';
import type { ListingFilters } from './useListingFilters';
import type { FilterActions } from './useFilterActions';
import { ActiveFilterChips } from './ActiveFilterChips';

/** Mobil ko'rinishdagi yopishqoq sarlavha: qidiruv, saralash, filtr tugmasi va chiplar. */
export function MobileHeader({ f, actions, onBack }: {
  f: ListingFilters;
  actions: FilterActions;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const { localSearch, setLocalSearch, handleSearch, viewMode, setViewMode, sortBy, setSortBy, setIsMobileFilterOpen } = f;
  const { activeFilterCount } = actions;

  return (
    <div className="sticky top-0 z-40 glass-bar border-b border-gray-200/50 dark:border-gray-800/60 md:hidden">
      {/* Top row: Title/Search input + Back button + View mode */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <button
          onClick={onBack}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl glass-soft text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Umumiy qidiruv maydoni: takliflar va ovozli qidiruv bilan */}
        <div className="flex-1 min-w-0">
          <SearchBox variant="mobile" value={localSearch} placeholder={t.nav.searchPlaceholder}
            onSubmit={(q) => { setLocalSearch(q); handleSearch(q); }} globalShortcut />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-xl border border-gray-200/60 dark:border-gray-800 glass-soft p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg px-2 py-1 transition-all ${viewMode === 'grid' ? 'bg-white/80 dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg px-2 py-1 transition-all ${viewMode === 'list' ? 'bg-white/80 dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Second row: Filter trigger & Sort options */}
      <div className="flex items-center gap-2 px-4 pb-2.5">
        {/* Filter button */}
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center rounded-full border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-xs font-medium shrink-0 transition-colors"
        >
          {t.listing.filters}
          {activeFilterCount > 0 && <span className="ml-1 text-violet-600 dark:text-violet-400">{activeFilterCount}</span>}
        </button>

        {/* Sort scroll */}
        <div className="flex-1 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SORT_OPTIONS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                sortBy === key
                  ? 'border-violet-100 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                  : 'border-gray-200/60 dark:border-gray-800 glass-soft text-gray-500 dark:text-gray-400'
              }`}
            >
              {(t.listing as any)[labelKey] ?? labelKey}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Horizontally Scrolling Bar (Mobile only) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 pb-2 pt-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-t border-gray-100/50 dark:border-gray-900/50">
          <ActiveFilterChips f={f} actions={actions} variant="mobile" />
        </div>
      )}
    </div>
  );
}
