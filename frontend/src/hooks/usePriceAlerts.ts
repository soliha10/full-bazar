import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** Kuzatilgan mahsulot narxi foydalanuvchi oxirgi ko'rgan narxdan o'zgargan (python/fastapi_app/price_alerts.py) */
export interface PriceAlert {
  id: string;
  slug: string | null;
  name: string;
  image: string | null;
  old_price: number;
  new_price: number;
  pct: number;
  source: string | null;
}

export type PriceAlertState =
  | { kind: 'changes'; items: PriceAlert[] }
  | { kind: 'intro' }
  | null;

// Sessiya davomida "Keyinroq" — keyingi kirishda yana ko'rsatiladi
const laterKey = (uid: string) => `bazar_price_alerts_later_${uid}`;
// Tanishtiruv xabari bir martagina
const introKey = (uid: string) => `bazar_price_alerts_intro_${uid}`;

function storageGet(store: () => Storage, key: string) {
  try { return store().getItem(key); } catch { return null; }
}
function storageSet(store: () => Storage, key: string, value: string) {
  try { store().setItem(key, value); } catch { /* xususiy rejim — xabar yana chiqishi mumkin, xolos */ }
}

/**
 * Tizimga kirgan foydalanuvchi saytni ochganda (yoki login/ro'yxatdan o'tgach)
 * kuzatuv ro'yxatidagi narx o'zgarishlarini oladi. O'zgarish bo'lmasa va ro'yxat
 * bo'sh bo'lsa — funksiyani tanishtiruvchi xabar (bir marta).
 */
export function usePriceAlerts() {
  const { user } = useAuth();
  const [state, setState] = useState<PriceAlertState>(null);

  useEffect(() => {
    setState(null);
    if (!user) return;
    if (storageGet(() => sessionStorage, laterKey(user.id))) return;
    let cancelled = false;
    fetch('/api/users/me/price-alerts', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { watching: number; items: PriceAlert[] } | null) => {
        if (cancelled || !data) return;
        if (data.items.length) setState({ kind: 'changes', items: data.items });
        else if (data.watching === 0 && !storageGet(() => localStorage, introKey(user.id))) setState({ kind: 'intro' });
      })
      .catch(() => { /* xabar — qo'shimcha; tarmoq xatosi sahifaga ta'sir qilmaydi */ });
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** O'zgarishlar ko'rildi — serverda asos narx yangilanadi, xabar qayta chiqmaydi */
  const markSeen = useCallback(() => {
    if (!user || state?.kind !== 'changes') return;
    const ids = state.items.map(i => i.id);
    setState(null);
    fetch('/api/users/me/price-alerts/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ product_ids: ids }),
    }).catch(() => { /* keyingi kirishda xabar yana chiqadi — zarari yo'q */ });
  }, [user, state]);

  /**
   * Yopish. "Keyinroq" — shu sessiyaga (keyingi kirishda yana chiqadi);
   * tanishtiruvni yopish (×) yoki undagi tugma — butunlay, bir martalik xabar.
   */
  const dismiss = useCallback((forever = false) => {
    if (!user || !state) return;
    if (forever && state.kind === 'intro') storageSet(() => localStorage, introKey(user.id), '1');
    else storageSet(() => sessionStorage, laterKey(user.id), '1');
    setState(null);
  }, [user, state]);

  return { state, markSeen, dismiss };
}
