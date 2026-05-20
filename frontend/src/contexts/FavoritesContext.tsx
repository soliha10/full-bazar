import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '../components/ProductCard';

const KEY = 'bazar_favorites';

function read(): Product[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

interface FavoritesContextValue {
  favorites: Product[];
  toggle: (product: Product) => void;
  isLiked: (id: string | number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>(read);

  const toggle = useCallback((product: Product) => {
    setFavorites(prev => {
      const next = prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [product, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isLiked = useCallback(
    (id: string | number) => favorites.some(p => p.id === id),
    [favorites],
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isLiked }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be inside FavoritesProvider');
  return ctx;
}
