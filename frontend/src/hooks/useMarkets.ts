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
  /** Do'kon sayti (e'lonlari havolalaridan): "texnomart.uz" */
  domain: string | null;
  /** Logotip — API do'kon saytidan oladi; yo'q bo'lsa bosh harf ko'rsatiladi */
  logo: string | null;
}

type ApiMarket = { key: string; name: string; count: number; domain?: string | null; logo?: string | null };

let cache: MarketFacet[] | null = null;
let inflight: Promise<MarketFacet[]> | null = null;

function load(): Promise<MarketFacet[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch('/api/markets')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { markets?: ApiMarket[] }) => {
      cache = (d.markets ?? [])
        .map(m => ({ key: m.key, name: m.name, count: m.count, domain: m.domain ?? null, logo: m.logo ?? null }))
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
