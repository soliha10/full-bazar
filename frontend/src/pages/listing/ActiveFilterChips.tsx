import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import type { ListingFilters } from './useListingFilters';
import type { FilterActions } from './useFilterActions';

// Barcha chiplar bir xil, neytral ko'rinishda. Ilgari har tur o'z rangida
// edi (binafsha, sariq, yashil, ko'k, kulrang) — beshta rang bir qatorda
// "nima tanlangan" degan oddiy ma'lumotni shovqinga aylantirardi.
const STYLES = {
  mobile: {
    chip:  'flex items-center gap-1 shrink-0 rounded-full glass-soft pl-2.5 pr-1 py-0.5 text-xs text-gray-700 dark:text-gray-300',
    reset: 'shrink-0 px-2 py-0.5 text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors',
    icon:  'w-3 h-3',
  },
  desktop: {
    chip:  'flex items-center gap-1 rounded-full glass-soft pl-3 pr-1.5 py-1 text-xs text-gray-700 dark:text-gray-300',
    reset: 'px-2 py-1 text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors',
    icon:  'w-3.5 h-3.5',
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

  const Chip = ({ label, onClear }: { label: React.ReactNode; onClear: () => void }) => (
    <span className={s.chip}>
      {label}
      <button type="button" onClick={onClear} aria-label={t.listing.clear}
        className="p-0.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
        <X className={s.icon} />
      </button>
    </span>
  );

  return (
    <>
      {selectedBrand && <Chip label={brandLabel(selectedBrand)} onClear={() => setSelectedBrand(null)} />}
      {minRating > 0 && <Chip label={`${minRating}+ ★`} onClear={() => setMinRating(0)} />}
      {(minPrice || maxPrice) && (
        <Chip
          label={`${minPrice ? formatSum(Number(minPrice.replace(/\s/g, ''))) : '0'} – ${maxPrice ? formatSum(Number(maxPrice.replace(/\s/g, ''))) : '∞'}`}
          onClear={() => { setMinPrice(''); setMaxPrice(''); }} />
      )}
      {specChips.map(chip => <Chip key={chip.key} label={chip.label} onClear={chip.clear} />)}
      {selectedMarketplaces.map(mk => (
        <Chip key={mk} label={marketFacets.find(m => m.key === mk)?.name ?? mk} onClear={() => toggleMarketplace(mk)} />
      ))}
      <button type="button" onClick={handleResetFilters} className={s.reset}>{t.listing.reset}</button>
    </>
  );
}
