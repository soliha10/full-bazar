import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';
import { mapProduct } from '../utils/productMapper';
import { Product } from '../components/ProductCard';

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
): UseProductsResult {
  const normalizedSearch = search.trim();

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
    queryKey: ['products', normalizedSearch, limit, markets],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchProducts(pageParam, limit, normalizedSearch, signal, markets),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage?.hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
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
