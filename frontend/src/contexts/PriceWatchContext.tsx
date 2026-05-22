import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product } from '../components/ProductCard';
import { useAuth } from './AuthContext';

const localKey = (uid: string) => `bazar_watch_${uid}`;

function readLocal(uid: string): Product[] {
  try { return JSON.parse(localStorage.getItem(localKey(uid)) ?? '[]'); }
  catch { return []; }
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

interface PriceWatchContextValue {
  watched: Product[];
  toggle: (product: Product) => void;
  isWatched: (id: string | number) => boolean;
}

const PriceWatchContext = createContext<PriceWatchContextValue | null>(null);

export function PriceWatchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [watched, setWatched] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('bazar_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id) return readLocal(u.id);
      }
    } catch { /* ignore */ }
    return [];
  });

  // Sync with server whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      setWatched([]);
      return;
    }

    const { token, id: uid } = user;

    // Show cached data instantly, then refresh from server
    setWatched(readLocal(uid));

    (async () => {
      try {
        const res = await fetch('/api/users/me/watchlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const serverItems: Product[] = (await res.json()).items ?? [];
        localStorage.setItem(localKey(uid), JSON.stringify(serverItems));
        setWatched(serverItems);
      } catch { /* keep local cache */ }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((product: Product) => {
    if (!user) return;
    const { token, id: uid } = user;

    setWatched(prev => {
      const adding = !prev.some(p => p.id === product.id);
      const next = adding
        ? [product, ...prev]
        : prev.filter(p => p.id !== product.id);

      localStorage.setItem(localKey(uid), JSON.stringify(next));

      if (adding) {
        fetch(`/api/users/me/watchlist/${product.id}`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ product }),
        }).catch(() => {});
      } else {
        fetch(`/api/users/me/watchlist/${product.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

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
