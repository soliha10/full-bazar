import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product } from '../components/ProductCard';
import { useAuth } from './AuthContext';

const PREFIX = 'bazar_watch_';

function key(userId: string) { return `${PREFIX}${userId}`; }

function read(userId: string | undefined): Product[] {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(key(userId)) ?? '[]'); }
  catch { return []; }
}

interface PriceWatchContextValue {
  watched: Product[];
  toggle: (product: Product) => void;
  isWatched: (id: string | number) => boolean;
}

const PriceWatchContext = createContext<PriceWatchContextValue | null>(null);

export function PriceWatchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [watched, setWatched] = useState<Product[]>(() => read(user?.id));

  useEffect(() => {
    setWatched(read(user?.id));
  }, [user?.id]);

  const toggle = useCallback((product: Product) => {
    if (!user) return;
    setWatched(prev => {
      const next = prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [product, ...prev];
      localStorage.setItem(key(user.id), JSON.stringify(next));
      return next;
    });
  }, [user]);

  const isWatched = useCallback(
    (id: string | number) => watched.some(p => p.id === id),
    [watched],
  );

  return (
    <PriceWatchContext.Provider value={{ watched, toggle, isWatched }}>
      {children}
    </PriceWatchContext.Provider>
  );
}

export function usePriceWatch() {
  const ctx = useContext(PriceWatchContext);
  if (!ctx) throw new Error('usePriceWatch must be inside PriceWatchProvider');
  return ctx;
}
