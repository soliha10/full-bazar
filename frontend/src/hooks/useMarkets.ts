import { useEffect, useState } from 'react';

/**
 * Do'konlar ro'yxati — YAGONA manba: `/api/markets` (bazada haqiqatan narxi
 * bor do'konlar, mahsulot soni bilan).
 *
 * Ilgari ro'yxat ikki joyda qo'lda yozilgan edi (bosh sahifada 21 ta, katalogda
 * 18 ta) va bazaga mos kelmasdi: Mediapark, Premier, OLX kabi narxi umuman
 * yo'q do'konlar ko'rsatilardi. Zaxira ro'yxat YO'Q — API javob bermasa,
 * chaqiruvchi xatoni ko'rsatadi, o'ylab topilgan ro'yxatni emas.
 */

export interface MarketFacet {
  /** Filtr kaliti, kichik harfda: "texnomart" */
  key: string;
  /** Bazadagi nomi: "Texnomart" */
  name: string;
  /** Shu do'kondagi takliflar soni */
  count: number;
  color: string;
}

/** Faqat bezak: do'kon belgisi rangi. Ro'yxatda yo'q do'kon kulrang. */
export const MARKET_COLOR: Record<string, string> = {
  asaxiy: '#7C3AED', texnomart: '#E31E24', olcha: '#F97316', chakana: '#0EA5E9',
  glotr: '#8B5CF6', openshop: '#6366F1', idea: '#F59E0B', beemarket: '#EC4899',
  castore: '#14B8A6', joybox: '#F43F5E', alif: '#0891B2', discont: '#EF4444',
  macbro: '#1D4ED8', radius: '#84CC16', mi: '#FF6900', ucell: '#65A30D', ozon: '#005BFF',
};

export const marketColor = (key: string) => MARKET_COLOR[key] ?? '#9ca3af';

let cache: MarketFacet[] | null = null;
let inflight: Promise<MarketFacet[]> | null = null;

function load(): Promise<MarketFacet[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch('/api/markets')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { markets?: { key: string; name: string; count: number }[] }) => {
      cache = (d.markets ?? [])
        .map(m => ({ key: m.key, name: m.name, count: m.count, color: marketColor(m.key) }))
        .sort((a, b) => b.count - a.count);
      return cache;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

export function useMarkets() {
  const [markets, setMarkets] = useState<MarketFacet[]>(cache ?? []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(cache ? 'ready' : 'loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    setStatus('loading');
    load()
      .then(list => { if (alive) { setMarkets(list); setStatus('ready'); } })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
  }, [attempt]);

  return { markets, status, retry: () => setAttempt(a => a + 1) };
}
