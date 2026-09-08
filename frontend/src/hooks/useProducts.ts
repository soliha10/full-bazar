import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';
import { mapProduct } from '../utils/productMapper';
import { Product } from '../components/ProductCard';

export interface SpecFilters {
  ram?: string[];
  storage?: string[];
  batteryMin?: number;
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isFetching: boolean;
  error: unknown;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  status: 'pending' | 'error' | 'success';
  refetch: () => void;
}

export function useProducts(
  _initialPage = 1,
  limit = 12,
  search = '',
  markets: string[] = [],
  brand = '',
  category = '',
  specs: SpecFilters = {},
): UseProductsResult {
  const normalizedSearch = search.trim();
  // queryKey ga barqaror kalit kerak: har renderда yangi obyekt kelsa,
  // react-query uni yangi so'rov deb hisoblab qayta yuklab yuborardi.
  const specsKey = JSON.stringify([specs.ram ?? [], specs.storage ?? [], specs.batteryMin ?? 0]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['products', normalizedSearch, limit, markets, brand, category, specsKey],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchProducts(pageParam, limit, normalizedSearch, signal, markets, brand, category, specs),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage?.hasMore ? lastPage.page + 1 : undefined;
    },
    // staleTime: 0 da har bir qayta ochish yangi so'rov yuborardi — orqaga
    // qaytish ham, filtrni eski holatiga qaytarish ham. Narxlar sinxronizatsiya
    // paytida o'zgaradi, sekundiga emas, shuning uchun 60 s butunlay xavfsiz va
    // takroriy ko'rishlarni darhol (keshdan) chiqaradi.
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const products: Product[] =
    data?.pages.flatMap((page) =>
      (page.products ?? []).map((item: any) => mapProduct(item)),
    ) ?? [];

  const total = data?.pages[data.pages.length - 1]?.total ?? 0;

  return {
    products,
    isLoading,
    isFetchingNextPage,
    isFetching,
    error,
    hasMore: Boolean(hasNextPage),
    total,
    loadMore: () => {
      void fetchNextPage();
    },
    status,
    refetch: () => {
      void refetch();
    },
  };
}
