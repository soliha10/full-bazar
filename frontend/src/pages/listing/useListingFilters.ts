import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { fetchSpecFacets } from '../../services/api';
import { useBrands } from '../../hooks/useBrands';
import { useMarkets } from '../../hooks/useMarkets';
import { getSavedFilters, type FilterTab, type SortKey } from './constants';

export type SpecFacets = {
  ram: { value: string; count: number }[];
  storage: { value: string; count: number }[];
  battery: { min: number; count: number }[];
};

/**
 * Katalog filtrlarining butun holati: qo'llangan qiymatlar, mobil oynadagi
 * qoralamalar (draft) va ular bilan bog'liq effektlar. Effektlar tartibi
 * sahifadagi asl tartib bilan bir xil — ProductListing shu hookni birinchi
 * chaqiradi.
 */
export function useListingFilters() {
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const searchQuery   = useMemo(() => new URLSearchParams(location.search).get('search') || '', [location.search]);
  const categoryParam = useMemo(() => new URLSearchParams(location.search).get('category') || 'All', [location.search]);

  const saved = useRef(getSavedFilters());
  // ?market=texnomart / ?brand=samsung — bosh sahifadagi havolalar shu bilan
  // katalogni darhol filtrlangan holda ochadi (sessiyadagi filtrdan ustun).
  const urlInit = useRef(() => {
    const p = new URLSearchParams(location.search);
    return { market: p.get('market'), brand: p.get('brand') };
  });
  const initial = useRef(urlInit.current());

  const [selectedCategory,     setSelectedCategory]     = useState(categoryParam);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(
    initial.current.market ? [initial.current.market.toLowerCase()] : saved.current?.selectedMarketplaces ?? []);
  const [minRating,     setMinRating]     = useState<number>(saved.current?.minRating ?? 0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    initial.current.brand ? initial.current.brand.toLowerCase() : saved.current?.selectedBrand ?? null);
  const [minPrice,  setMinPrice]  = useState<string>(saved.current?.minPrice ?? '');
  const [maxPrice,  setMaxPrice]  = useState<string>(saved.current?.maxPrice ?? '');
  const [sortBy,    setSortBy]    = useState<SortKey>(saved.current?.sortBy ?? 'relevance');
  const [viewMode,  setViewMode]  = useState<'grid' | 'list'>(saved.current?.viewMode ?? 'grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('price');
  // ── Xususiyat filtrlari (RAM / xotira / batareya) ──
  const [selectedRam,     setSelectedRam]     = useState<string[]>(saved.current?.selectedRam ?? []);
  const [selectedStorage, setSelectedStorage] = useState<string[]>(saved.current?.selectedStorage ?? []);
  const [minBattery,      setMinBattery]      = useState<number>(saved.current?.minBattery ?? 0);
  const [specFacets, setSpecFacets] = useState<SpecFacets>({ ram: [], storage: [], battery: [] });
  const { markets: marketFacets } = useMarkets();
  const marketCounts = useMemo(
    () => Object.fromEntries(marketFacets.map(m => [m.key, m.count])) as Record<string, number>,
    [marketFacets],
  );
  // Brendlar bazadan keladi; API javob bermasa zaxira ro'yxat ishlatiladi,
  // ya'ni filtr hech qachon bo'sh qolmaydi.
  const brandFacets = useBrands();
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p);
      if (query.trim()) {
        n.set('search', query.trim());
      } else {
        n.delete('search');
      }
      return n;
    });
  }, [setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = new URLSearchParams(location.search).get('search') || '';
      if (localSearch.trim() !== currentSearch.trim()) {
        handleSearch(localSearch);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localSearch, location.search, handleSearch]);

  // ── Draft states for filters ──
  const [draftCategory,     setDraftCategory]     = useState(selectedCategory);
  const [draftMarketplaces, setDraftMarketplaces] = useState<string[]>(selectedMarketplaces);
  const [draftRating,       setDraftRating]       = useState<number>(minRating);
  const [draftBrand,        setDraftBrand]        = useState<string | null>(selectedBrand);
  const [draftMinPrice,     setDraftMinPrice]     = useState<string>(minPrice);
  const [draftMaxPrice,     setDraftMaxPrice]     = useState<string>(maxPrice);
  const [draftRam,          setDraftRam]          = useState<string[]>(selectedRam);
  const [draftStorage,      setDraftStorage]      = useState<string[]>(selectedStorage);
  const [draftBattery,      setDraftBattery]      = useState<number>(minBattery);

  useEffect(() => {
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    if (isMobileFilterOpen) {
      setDraftCategory(selectedCategory);
      setDraftMarketplaces(selectedMarketplaces);
      setDraftRating(minRating);
      setDraftBrand(selectedBrand);
      setDraftMinPrice(minPrice);
      setDraftMaxPrice(maxPrice);
      setDraftRam(selectedRam);
      setDraftStorage(selectedStorage);
      setDraftBattery(minBattery);
    }
  }, [isMobileFilterOpen, selectedCategory, selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice,
      selectedRam, selectedStorage, minBattery]);

  // Filtr qiymatlari sinxronizatsiya orasida o'zgarmaydi — bir marta olinadi.
  useEffect(() => {
    fetchSpecFacets().then(setSpecFacets).catch(() => {});
  }, []);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  return {
    searchQuery, categoryParam, initial, setSearchParams, handleSearch,
    localSearch, setLocalSearch,
    selectedCategory, setSelectedCategory, selectedMarketplaces, setSelectedMarketplaces,
    minRating, setMinRating, selectedBrand, setSelectedBrand,
    minPrice, setMinPrice, maxPrice, setMaxPrice,
    sortBy, setSortBy, viewMode, setViewMode,
    isMobileFilterOpen, setIsMobileFilterOpen, activeFilterTab, setActiveFilterTab,
    selectedRam, setSelectedRam, selectedStorage, setSelectedStorage, minBattery, setMinBattery,
    specFacets, marketFacets, marketCounts, brandFacets, showAllMarkets, setShowAllMarkets,
    draftCategory, setDraftCategory, draftMarketplaces, setDraftMarketplaces,
    draftRating, setDraftRating, draftBrand, setDraftBrand,
    draftMinPrice, setDraftMinPrice, draftMaxPrice, setDraftMaxPrice,
    draftRam, setDraftRam, draftStorage, setDraftStorage, draftBattery, setDraftBattery,
  };
}

export type ListingFilters = ReturnType<typeof useListingFilters>;
