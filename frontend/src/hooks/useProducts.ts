import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';
import { mapProduct } from '../utils/productMapper';
import { Product } from '../components/ProductCard';

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isFetching: boolean; // Added isFetching
  error: any;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  status: string;
}

export function useProducts(
  _initialPage = 1,
  limit = 12,
  search = '',
): UseProductsResult {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching, // Extract isFetching
    isLoading,
    status
  } = useInfiniteQuery({
    queryKey: ['products', search, limit],
    queryFn: ({ pageParam = 1, signal }) => fetchProducts(pageParam, limit, search, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 0, // Ensure search results are always fresh
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 mins
  });

  // Flatten the pages data into a single products array
  const products: Product[] = data?.pages.flatMap((page) => 
    (page.products ?? []).map((item: any) => mapProduct(item))
  ) ?? [];

  // Get the latest total from the last page
  const total = data?.pages[data.pages.length - 1]?.total ?? 0;

  return {
    products,
    isLoading,
    isFetchingNextPage,
    isFetching,
    error,
    hasMore: !!hasNextPage,
    total,
    loadMore: fetchNextPage,
    status
  };
}
