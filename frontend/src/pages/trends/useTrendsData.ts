import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, type SearchTrend, type MarketStat, type PopularProduct, type PriceItem } from './types';

/** Tahlil sahifasining barcha ma'lumotlari — to'rtta endpointdan parallel. */
export function useTrendsData() {
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [markets, setMarkets] = useState<MarketStat[]>([]);
  const [popular, setPopular] = useState<PopularProduct[]>([]);
  const [dropping, setDropping] = useState<PriceItem[]>([]);
  const [rising, setRising] = useState<PriceItem[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failedSections, setFailedSections] = useState<string[]>([]);

  useEffect(() => {
    // allSettled, all emas: bitta endpoint yiqilsa Promise.all butun zanjirni
    // rad etadi va sahifa to'liq bo'sh qolardi — aynan shu sodir bo'lgan edi,
    // /api/search-trends 500 qaytarganda butun tahlil sahifasi bo'shab qolardi.
    let cancelled = false;

    Promise.allSettled([
      axios.get(`${API}/api/search-trends?days=7&limit=20`),
      axios.get(`${API}/api/market-analytics`),
      axios.get(`${API}/api/trends?limit=6`),
      axios.get(`${API}/api/stats`),
    ]).then(([trendsRes, analyticsRes, priceRes, statsRes]) => {
      if (cancelled) return;

      const failed: string[] = [];
      const data = <T,>(
        res: PromiseSettledResult<{ data: any }>,
        label: string,
        fallback: T,
      ): T | any => {
        if (res.status === 'fulfilled') return res.value.data;
        console.error(`[trends] ${label} olinmadi:`, res.reason?.message ?? res.reason);
        failed.push(label);
        return fallback;
      };

      const trends    = data(trendsRes,    'search-trends',    {});
      const analytics = data(analyticsRes, 'market-analytics', {});
      const price     = data(priceRes,     'trends',           {});
      const stats     = data(statsRes,     'stats',            {});

      setSearchTrends(trends.trends ?? []);
      setMarkets(analytics.markets ?? []);
      setPopular(analytics.popularProducts ?? []);
      setWeeklyEvents(analytics.weeklyEvents ?? 0);
      setDropping(price.dropping ?? []);
      setRising(price.rising ?? []);
      setTotalProducts(stats.products ?? 0);
      setTotalMarkets(stats.markets ?? 0);
      setFailedSections(failed);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return {
    searchTrends, markets, popular, dropping, rising,
    weeklyEvents, totalProducts, totalMarkets, loading, failedSections,
  };
}
