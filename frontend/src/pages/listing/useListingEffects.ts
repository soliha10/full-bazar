import { useEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import { FILTER_KEY } from './constants';
import type { ListingFilters } from './useListingFilters';

/**
 * Mahsulotlar yuklangandan keyingi effektlar: eskirgan filtrlarni tozalash,
 * aylantirish holatini saqlash/tiklash va filtrlarni sessiyaga yozish.
 * ProductListing buni useInfiniteProducts dan keyin chaqiradi — asl effektlar
 * tartibi saqlanadi.
 */
export function useListingEffects(f: ListingFilters, isLoading: boolean, productCount: number) {
  const {
    marketFacets, setSelectedMarketplaces, initial, setSearchParams, categoryParam, setSelectedCategory,
    searchQuery, selectedCategory, selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice,
    sortBy, viewMode, selectedRam, selectedStorage, minBattery,
  } = f;

  const navType = useNavigationType();
  const isFirstRender = useRef(true);
  const [scrollRestored, setScrollRestored] = useState(false);

  // Sessiyada qolgan, lekin endi bazada yo'q do'kon kaliti so'rovga ketib,
  // katalogni bo'sh qilib qo'ymasin
  useEffect(() => {
    if (marketFacets.length === 0) return;
    const known = new Set(marketFacets.map(m => m.key));
    setSelectedMarketplaces(prev => (prev.every(k => known.has(k)) ? prev : prev.filter(k => known.has(k))));
  }, [marketFacets]);

  // URL dagi ?market= / ?brand= bir marta o'qilgach olib tashlanadi —
  // aks holda filtr tozalansa ham manzil satrida eskisi qolardi
  useEffect(() => {
    if (!initial.current.market && !initial.current.brand) return;
    setSearchParams(p => { const n = new URLSearchParams(p); n.delete('market'); n.delete('brand'); return n; }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => { setSelectedCategory(categoryParam); }, [categoryParam]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    sessionStorage.removeItem('productListingScrollY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem('productListingScrollY', String(window.scrollY));
    };
  }, []);

  useEffect(() => {
    if (navType !== 'POP') {
      setScrollRestored(true);
      return;
    }

    if (!isLoading && productCount > 0 && !scrollRestored) {
      const savedScroll = sessionStorage.getItem('productListingScrollY');
      if (savedScroll) {
        const y = parseFloat(savedScroll);
        if (y > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({ top: y, behavior: 'auto' });
          }, 80);
          setScrollRestored(true);
          return () => clearTimeout(timer);
        }
      }
      setScrollRestored(true);
    }
  }, [isLoading, productCount, scrollRestored, navType]);

  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({
      selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode,
      selectedRam, selectedStorage, minBattery,
    }));
  }, [selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode,
      selectedRam, selectedStorage, minBattery]);
}
