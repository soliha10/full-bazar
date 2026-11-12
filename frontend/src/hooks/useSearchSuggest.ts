import { useEffect, useState } from 'react';

export interface SuggestProduct { id: string; slug: string | null; name: string; image: string; price: number; stores: number }
export interface SuggestBrand { key: string; name: string; count: number }
export interface Suggestions { query: string; products: SuggestProduct[]; brands: SuggestBrand[] }

const cache = new Map<string, Suggestions>();
const DEBOUNCE_MS = 140;

/**
 * Yozish paytidagi takliflar (/api/search/suggest — Elasticsearch). Har harf
 * so'rov yubormaydi (debounce), eskirgan so'rov bekor qilinadi, bir xil
 * so'rov qayta yuklanmaydi.
 */
export function useSearchSuggest(query: string, enabled: boolean) {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const [data, setData] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || q.length < 2) { setData(null); setLoading(false); return; }
    const hit = cache.get(q);
    if (hit) { setData(hit); setLoading(false); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const id = window.setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d: Suggestions) => { cache.set(q, d); setData(d); })
        .catch(() => { if (!ctrl.signal.aborted) setData(null); })
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    }, DEBOUNCE_MS);
    return () => { ctrl.abort(); window.clearTimeout(id); };
  }, [q, enabled]);

  return { data, loading, query: q };
}
