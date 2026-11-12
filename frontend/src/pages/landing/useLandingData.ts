import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { mapProduct } from '../../utils/productMapper';
import { fetchPersonalizedRecommendations } from '../../services/api';
import type { Product } from '../../components/ProductCard';
import { fmt, type Stats } from './shared';

/** Bosh sahifaning serverdan keladigan ma'lumotlari (statistika, eng katta
 *  narx farqlari, shaxsiy tavsiyalar) va ulardan yasaladigan matnlar. */
export function useLandingData() {
  const { t } = useLanguage();
  const h = t.home;

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [deals, setDeals] = useState<Product[]>([]);
  const [dealsStatus, setDealsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [personalizedRecs, setPersonalizedRecs] = useState<Product[]>([]);
  const [personalizedType, setPersonalizedType] = useState('');
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
    fetch('/api/recommendations?limit=10')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => { if (alive) { setDeals((d.products ?? []).map(mapProduct)); setDealsStatus('ready'); } })
      .catch(() => { if (alive) setDealsStatus('error'); });
    return () => { alive = false; };
  }, [attempt]);

  useEffect(() => {
    fetchPersonalizedRecommendations(8)
      .then(data => {
        setPersonalizedRecs((data.products ?? []).map(mapProduct));
        setPersonalizedType(data.type ?? '');
      })
      .catch(() => {});
  }, []);

  const relativeUpdated = (iso: string | null | undefined) => {
    if (!iso) return null;
    const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (Number.isNaN(mins)) return null;
    if (mins < 2) return h.updatedJustNow;
    if (mins < 60) return h.updatedMinutes.replace('{{count}}', String(mins));
    if (mins < 48 * 60) return h.updatedHours.replace('{{count}}', String(Math.floor(mins / 60)));
    return h.updatedDays.replace('{{count}}', String(Math.floor(mins / 1440)));
  };
  const updated = relativeUpdated(stats?.lastUpdated);
  const fill = (s: string) => s
    .replace('{{products}}', stats ? fmt(stats.products) : '…')
    .replace('{{stores}}', stats ? fmt(stats.markets) : '…')
    .replace('{{comparable}}', stats ? fmt(stats.comparableProducts) : '…');

  const retry = () => setAttempt(a => a + 1);

  return {
    stats, statsFailed, deals, dealsStatus, personalizedRecs, personalizedType,
    updated, fill, retry,
  };
}
