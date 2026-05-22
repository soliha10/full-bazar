import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product } from '../components/ProductCard';
import { useAuth } from './AuthContext';

const GUEST_KEY = 'bazar_favorites';
const userKey = (uid: string) => `bazar_favorites_${uid}`;

function readLocal(key: string): Product[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); }
  catch { return []; }
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

interface FavoritesContextValue {
  favorites: Product[];
  toggle: (product: Product) => void;
  isLiked: (id: string | number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<Product[]>(() => {
    // Fast initial render: use user-specific cache if already logged in
    try {
      const stored = localStorage.getItem('bazar_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id) return readLocal(userKey(u.id));
      }
    } catch { /* ignore */ }
    return readLocal(GUEST_KEY);
  });

  // Sync with server whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      // Logged out → fall back to guest list
      setFavorites(readLocal(GUEST_KEY));
      return;
    }

    const { token, id: uid } = user;

    (async () => {
      try {
        const res = await fetch('/api/users/me/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setFavorites(readLocal(userKey(uid)));
          return;
        }
        const serverItems: Product[] = (await res.json()).items ?? [];

        // Merge: push any guest-only items up to the server
        const guestItems = readLocal(GUEST_KEY);
        const serverIds = new Set(serverItems.map(p => String(p.id)));
        const newFromGuest = guestItems.filter(p => !serverIds.has(String(p.id)));

        if (newFromGuest.length > 0) {
          await Promise.allSettled(
            newFromGuest.map(p =>
              fetch(`/api/users/me/favorites/${p.id}`, {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ product: p }),
              })
            )
          );
        }

        const merged = dedup([...serverItems, ...newFromGuest]);
        localStorage.setItem(userKey(uid), JSON.stringify(merged));
        // Clear anonymous guest list after merge
        localStorage.removeItem(GUEST_KEY);
        setFavorites(merged);
      } catch {
        // Network error — use locally cached data for this user
        setFavorites(readLocal(userKey(uid)));
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((product: Product) => {
    setFavorites(prev => {
      const adding = !prev.some(p => p.id === product.id);
      const next = adding
        ? [product, ...prev]
        : prev.filter(p => p.id !== product.id);

      if (user) {
        localStorage.setItem(userKey(user.id), JSON.stringify(next));
        if (adding) {
          fetch(`/api/users/me/favorites/${product.id}`, {
            method: 'POST',
            headers: authHeaders(user.token),
            body: JSON.stringify({ product }),
          }).catch(() => {});
        } else {
          fetch(`/api/users/me/favorites/${product.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${user.token}` },
          }).catch(() => {});
        }
      } else {
        localStorage.setItem(GUEST_KEY, JSON.stringify(next));
      }

      return next;
    });
  }, [user]);

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

function dedup(items: Product[]): Product[] {
  const seen = new Set<string>();
  return items.filter(p => {
    const k = String(p.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
