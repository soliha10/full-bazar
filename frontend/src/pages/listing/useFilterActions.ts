import { useCallback, useMemo } from 'react';
import { normalizePriceRange } from './constants';
import type { ListingFilters } from './useListingFilters';

export interface SpecChip { key: string; label: string; clear: () => void }

/**
 * Filtrlar ustidagi amallar va hosilaviy qiymatlar. Bu yerda effekt yo'q —
 * faqat memo va callback'lar, shuning uchun chaqirilish o'rni effektlar
 * tartibiga ta'sir qilmaydi.
 */
export function useFilterActions(f: ListingFilters) {
  const {
    selectedRam, setSelectedRam, selectedStorage, setSelectedStorage, minBattery, setMinBattery,
    minRating, selectedBrand, selectedMarketplaces, minPrice, maxPrice,
    brandFacets, setSearchParams,
  } = f;

  /**
   * Faol xususiyat filtrlari (RAM / xotira / batareya).
   *
   * Bularning chipi yo'q edi: filtr so'rovga qo'shilardi va activeFilterCount
   * ga sanalardi, lekin ekranda hech qanday izi ko'rinmasdi. Sessiyada
   * saqlanib qolgan "8GB" kabi qiymat shu sababli KO'RINMAS filtrga
   * aylanardi — foydalanuvchi brend tanlaganda katalog bo'sh chiqar, sababi
   * esa hech qayerda ko'rinmasdi. Endi har biri o'chirsa bo'ladigan chip.
   */
  const specChips = useMemo(() => {
    const chips: SpecChip[] = [];
    for (const v of selectedRam) {
      chips.push({
        key: `ram-${v}`, label: `${v} RAM`,
        clear: () => setSelectedRam(prev => prev.filter(x => x !== v)),
      });
    }
    for (const v of selectedStorage) {
      chips.push({
        key: `st-${v}`, label: v,
        clear: () => setSelectedStorage(prev => prev.filter(x => x !== v)),
      });
    }
    if (minBattery > 0) {
      chips.push({
        key: 'battery', label: `${minBattery}+ mAh`,
        clear: () => setMinBattery(0),
      });
    }
    return chips;
  }, [selectedRam, selectedStorage, minBattery]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (minRating > 0) n++;
    if (selectedBrand) n++;
    n += selectedMarketplaces.length;
    if (minPrice || maxPrice) n++;
    n += selectedRam.length + selectedStorage.length;
    if (minBattery > 0) n++;
    return n;
  }, [minRating, selectedBrand, selectedMarketplaces, minPrice, maxPrice,
      selectedRam, selectedStorage, minBattery]);

  // Filtr kaliti kichik harfda ("poco"), ekranda esa chiroyli nomi kerak.
  const brandLabel = useCallback(
    (key: string) => brandFacets.find(b => b.key === key)?.name ?? key,
    [brandFacets],
  );

  const updateUrlCategory = useCallback((v: string) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p);
      v && v !== 'All' ? n.set('category', v) : n.delete('category');
      return n;
    }, { replace: true });
  }, [setSearchParams]);

  const handleResetFilters = () => {
    f.setSelectedCategory('All'); f.setSelectedMarketplaces([]); f.setMinRating(0);
    f.setSelectedBrand(null); f.setMinPrice(''); f.setMaxPrice(''); f.setSortBy('relevance');
    setSelectedRam([]); setSelectedStorage([]); setMinBattery(0);
    f.setDraftRam([]); f.setDraftStorage([]); f.setDraftBattery(0);
    updateUrlCategory('All');
    // Reset drafts too
    f.setDraftCategory('All'); f.setDraftMarketplaces([]); f.setDraftRating(0);
    f.setDraftBrand(null); f.setDraftMinPrice(''); f.setDraftMaxPrice('');
  };

  const handleApplyMobileFilters = () => {
    f.setSelectedCategory(f.draftCategory);
    updateUrlCategory(f.draftCategory);
    f.setSelectedMarketplaces(f.draftMarketplaces);
    f.setMinRating(f.draftRating);
    f.setSelectedBrand(f.draftBrand);
    const [lo, hi] = normalizePriceRange(f.draftMinPrice, f.draftMaxPrice);
    f.setMinPrice(lo);
    f.setMaxPrice(hi);
    setSelectedRam(f.draftRam);
    setSelectedStorage(f.draftStorage);
    setMinBattery(f.draftBattery);
    f.setIsMobileFilterOpen(false);
  };

  const toggleMarketplace = useCallback((key: string) => {
    f.setSelectedMarketplaces(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const clearSearch = () => {
    f.setLocalSearch('');
    f.handleSearch('');
  };

  return {
    specChips, activeFilterCount, brandLabel,
    handleResetFilters, handleApplyMobileFilters, toggleMarketplace, clearSearch,
  };
}

export type FilterActions = ReturnType<typeof useFilterActions>;
