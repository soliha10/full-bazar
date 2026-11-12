import { X, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BRAND_COLORS } from '../../hooks/useBrands';
import { formatSum } from '../../utils/productMapper';
import type { ListingFilters } from './useListingFilters';
import type { FilterActions } from './useFilterActions';

// Mobil chiplar ixcham (gorizontal aylanadigan qatorda), desktopdagilari
// kattaroq va dumaloq. Tuzilishi bir xil, faqat klasslar farq qiladi.
const STYLES = {
  mobile: {
    brand:  'flex items-center gap-1 shrink-0 rounded-lg border border-violet-100 dark:border-violet-950 bg-violet-50/50 dark:bg-violet-950/20 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400',
    rating: 'flex items-center gap-1 shrink-0 rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400',
    price:  'flex items-center gap-1 shrink-0 rounded-lg border border-green-100 dark:border-green-950 bg-green-50/50 dark:bg-green-950/20 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400',
    spec:   'flex items-center gap-1 shrink-0 rounded-lg border border-sky-100 dark:border-sky-950 bg-sky-50/50 dark:bg-sky-950/20 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-400',
    market: 'flex items-center gap-1 shrink-0 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-300',
    reset:  'flex items-center gap-1 shrink-0 rounded-lg border border-red-100 dark:border-red-950 bg-red-50/40 dark:bg-red-950/20 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 hover:text-red-500 transition-colors',
    close: 'ml-1 opacity-60 hover:opacity-100',
    icon:  'w-2.5 h-2.5',
  },
  desktop: {
    brand:  'flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400',
    rating: 'flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400',
    price:  'flex items-center gap-1 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:text-green-400',
    spec:   'flex items-center gap-1 rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400',
    market: 'flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300',
    reset:  'flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-red-500 transition-colors',
    close: 'ml-0.5 opacity-60 hover:opacity-100',
    icon:  'w-3 h-3',
  },
};

/** Faol filtrlar chiplari — har birini alohida o'chirish mumkin. */
export function ActiveFilterChips({ f, actions, variant }: {
  f: ListingFilters;
  actions: FilterActions;
  variant: 'mobile' | 'desktop';
}) {
  const { t } = useLanguage();
  const s = STYLES[variant];
  const { selectedBrand, setSelectedBrand, minRating, setMinRating, minPrice, maxPrice, setMinPrice, setMaxPrice,
    selectedMarketplaces, marketFacets } = f;
  const { brandLabel, specChips, toggleMarketplace, handleResetFilters } = actions;

  return (
    <>
      {selectedBrand && (
        <span className={s.brand}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[selectedBrand] ?? '#555' }} />
          {brandLabel(selectedBrand)}
          <button onClick={() => setSelectedBrand(null)} className={s.close}><X className={s.icon} /></button>
        </span>
      )}
      {minRating > 0 && (
        <span className={s.rating}>
          {variant === 'mobile' ? <>★ {minRating}+</> : <>{'★'.repeat(Math.floor(minRating))} {minRating}+</>}
          <button onClick={() => setMinRating(0)} className={s.close}><X className={s.icon} /></button>
        </span>
      )}
      {(minPrice || maxPrice) && (
        <span className={s.price}>
          {minPrice ? formatSum(Number(minPrice.replace(/\s/g, ''))) : '0'} — {maxPrice ? formatSum(Number(maxPrice.replace(/\s/g, ''))) : '∞'}
          <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className={s.close}><X className={s.icon} /></button>
        </span>
      )}
      {specChips.map(chip => (
        <span key={chip.key} className={s.spec}>
          {chip.label}
          <button onClick={chip.clear} className={s.close}><X className={s.icon} /></button>
        </span>
      ))}
      {selectedMarketplaces.map(mk => {
        const mp = marketFacets.find(m => m.key === mk);
        return (
          <span key={mk} className={s.market}>
            {mp && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mp.color }} />}
            {mp?.name ?? mk}
            <button onClick={() => toggleMarketplace(mk)} className={s.close}><X className={s.icon} /></button>
          </span>
        );
      })}
      <button onClick={handleResetFilters} className={s.reset}>
        <RotateCcw className={s.icon} /> {t.listing.reset}
      </button>
    </>
  );
}
