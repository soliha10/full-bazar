import { useEffect, useRef } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { SERVER_SORT, priceNum } from './constants';
import type { ListingFilters } from './useListingFilters';

/**
 * Qo'llangan filtrlar bo'yicha mahsulotlar + cheksiz aylantirish.
 *
 * Barcha filtr va saralash serverda (useProducts → /api/products). Ilgari
 * narx, reyting va saralash shu yerda faqat yuklangan sahifaga qo'llanardi.
 */
export function useInfiniteProducts(f: ListingFilters) {
  const {
    searchQuery, selectedMarketplaces, selectedBrand, selectedCategory,
    selectedRam, selectedStorage, minBattery, minPrice, maxPrice, minRating, sortBy,
  } = f;

  // ── infinite scroll ──
  const sentinelRef       = useRef<HTMLDivElement>(null);
  const hasMoreRef        = useRef(false);
  const fetchingRef       = useRef(false);
  const loadMoreRef       = useRef<() => void>(() => {});
  const isIntersectingRef = useRef(false);

  const result =
    useProducts(1, 20, searchQuery, selectedMarketplaces, selectedBrand ?? '', selectedCategory === 'All' ? '' : selectedCategory,
      { ram: selectedRam, storage: selectedStorage, batteryMin: minBattery },
      { minPrice: priceNum(minPrice), maxPrice: priceNum(maxPrice), minRating: minRating || undefined, sort: SERVER_SORT[sortBy] });
  const { isFetchingNextPage, hasMore, loadMore } = result;

  hasMoreRef.current  = hasMore;
  fetchingRef.current = isFetchingNextPage;
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        isIntersectingRef.current = e.isIntersecting;
        if (e.isIntersecting && hasMoreRef.current && !fetchingRef.current) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (hasMoreRef.current && !fetchingRef.current && isIntersectingRef.current) {
      loadMoreRef.current();
    }
  });

  return { ...result, sentinelRef };
}
