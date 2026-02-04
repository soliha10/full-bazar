import { useState, useEffect, useCallback } from 'react';
import { Product } from '../components/ProductCard';
import { fetchProducts } from '../services/api';
import { mapProduct } from '../utils/productMapper';

export function useProducts(initialPage = 1, limit = 12) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const loadProducts = useCallback(async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const data = await fetchProducts(pageNum, limit);
      // data: { products, total, page, limit, hasMore }
      
      const mappedNewProducts: Product[] = data.products.map((item: any) => mapProduct(item));
      
      setProducts(prev => isInitial ? mappedNewProducts : [...prev, ...mappedNewProducts]);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit]);

  useEffect(() => {
    loadProducts(1, true);
    setPage(1);
  }, []); // Only on mount or manual reset

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProducts(nextPage);
    }
  }, [loadingMore, hasMore, page, loadProducts]);

  const refresh = useCallback(() => {
    loadProducts(1, true);
    setPage(1);
  }, [loadProducts]);

  return { products, loading, loadingMore, error, hasMore, loadMore, refresh };
}
