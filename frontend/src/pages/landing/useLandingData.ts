import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { mapProduct } from '../../utils/productMapper';
import type { Product } from '../../components/ProductCard';
import type { Stats } from './shared';
import { relativeUpdated } from '../../utils/relativeUpdated';

/** Bosh sahifaning serverdan keladigan ma'lumotlari (statistika, eng katta
 *  narx farqlari) va ulardan yasaladigan matnlar. */
export function useLandingData() {
  const { t } = useLanguage();
  const h = t.home;

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [deals, setDeals] = useState<Product[]>([]);
  const [dealsStatus, setDealsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatsFailed(false);
    // axios emas, fetch: bosh sahifa bundle'idan ~13 KB (gzip) tushadi
    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Stats) => { if (alive) setStats(d); })
      .catch(() => { if (alive) setStatsFailed(true); });

    setDealsStatus('loading');
    // diverse=1: server har modelni bir marta, har brenddan ko'pi bilan 3 tasini
    // qaytaradi (python/fastapi_app/recs_diverse.py) — 4 tasi hero dastasiga,
    // 8 tasi panjaraga
    fetch('/api/recommendations?limit=14&diverse=1')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => {
        if (!alive) return;
        setDeals((d.products ?? []).map(mapProduct));
        setDealsStatus('ready');
      })
      .catch(() => { if (alive) setDealsStatus('error'); });
    return () => { alive = false; };
  }, [attempt]);

  const updated = relativeUpdated(stats?.lastUpdated, h);
  const retry = () => setAttempt(a => a + 1);

  return {
    stats, statsFailed, deals, dealsStatus, updated, retry,
  };
}
