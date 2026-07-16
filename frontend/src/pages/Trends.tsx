import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Search, BarChart2,
  Eye, ShoppingBag, ArrowUpRight, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import axios from 'axios';
import { formatSum } from '../utils/productMapper';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_URL ?? '';

interface SearchTrend { query: string; count: number; uniqueSessions: number }
interface MarketStat {
  source: string; productCount: number;
  avgPrice: number; minPrice: number; maxPrice: number;
}
interface PopularProduct { id: string; name: string; price: number; image: string | null; viewCount: number }
interface PriceItem { id: string; name: string; price: number; priceChange: number; pctChange: number }

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const MARKET_COLORS = [
  '#7C3AED','#E31E24','#F97316','#10B981','#8B5CF6',
  '#F59E0B','#005BFF','#EF4444','#6D28D9','#EC4899',
  '#14B8A6','#374151','#DC2626','#059669','#2563EB',
];

export function Trends() {
  const { t, language } = useLanguage();
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [markets, setMarkets] = useState<MarketStat[]>([]);
  const [popular, setPopular] = useState<PopularProduct[]>([]);
  const [dropping, setDropping] = useState<PriceItem[]>([]);
  const [rising, setRising] = useState<PriceItem[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/search-trends?days=7&limit=20`),
      axios.get(`${API}/api/market-analytics`),
      axios.get(`${API}/api/trends?limit=6`),
      axios.get(`${API}/api/stats`),
    ]).then(([trendsRes, analyticsRes, priceRes, statsRes]) => {
      setSearchTrends(trendsRes.data.trends ?? []);
      setMarkets(analyticsRes.data.markets ?? []);
      setPopular(analyticsRes.data.popularProducts ?? []);
      setWeeklyEvents(analyticsRes.data.weeklyEvents ?? 0);
      setDropping(priceRes.data.dropping ?? []);
      setRising(priceRes.data.rising ?? []);
      setTotalProducts(statsRes.data.products ?? 0);
      setTotalMarkets(statsRes.data.markets ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxMarketCount = Math.max(...markets.map(m => m.productCount), 1);

  const seoTitle = language === 'uz' ? 'Trendlar va tahlil' : 'Тренды и аналитика';
  const seoDesc = language === 'uz'
    ? "O'zbekiston smartfon bozoridagi trendlar, eng ko'p qidirilgan telefonlar, narxi tushgan mahsulotlar va do'konlar tahlili."
    : "Тренды и аналитика рынка смартфонов в Узбекистане, популярные запросы и динамика цен.";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <SEO 
        title={seoTitle} 
        description={seoDesc} 
        keywords="smartfon trendlari, telefon narxlari tushishi, bazarcom tahlil, o'zbekiston telefon bozori"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t.trends.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.trends.subtitle}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t.trends.totalProducts}   value={totalProducts.toLocaleString()}  icon={ShoppingBag} color="bg-violet-600" />
        <StatCard label={t.trends.marketplaces}     value={totalMarkets}                     icon={BarChart2}   color="bg-blue-500"   />
        <StatCard label={t.trends.weeklyActivity} value={weeklyEvents.toLocaleString()}   icon={Eye}         color="bg-emerald-500"/>
        <StatCard label={t.trends.priceDrops}   value={dropping.length}                  icon={TrendingDown} color="bg-rose-500"  />
      </div>

      {/* Search trends */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.topSearches}</h2>
        </div>
        {searchTrends.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{t.trends.noSearchData}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {searchTrends.map((tItem, i) => (
              <Link
                key={tItem.query}
                to={`/products?search=${encodeURIComponent(tItem.query)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all
                  bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700
                  hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20
                  hover:text-violet-700 dark:hover:text-violet-300 group"
              >
                {i < 3 && <Flame className="w-3 h-3 text-orange-500 shrink-0" />}
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                  {tItem.query}
                </span>
                <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {tItem.count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Marketplace chart */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.marketRanking}</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <ResponsiveContainer width="100%" height={Math.min(markets.length * 36, 400)}>
            <BarChart data={markets.slice(0, 12)} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category" dataKey="source" width={90}
                tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }}
                tickLine={false} axisLine={false}
              />
              <Tooltip
                formatter={(v: number) => [t.trends.productsCount.replace('{{count}}', v.toString()), t.trends.product]}
                contentStyle={{
                  borderRadius: 12, border: '1px solid #e5e7eb',
                  fontSize: 12, fontWeight: 700,
                }}
              />
              <Bar dataKey="productCount" radius={[0, 6, 6, 0]} maxBarSize={24}>
                {markets.slice(0, 12).map((_, i) => (
                  <Cell key={i} fill={MARKET_COLORS[i % MARKET_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Avg price table */}
          <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.trends.avgPriceUzs}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {markets.slice(0, 8).map((m, i) => (
                <div key={m.source} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MARKET_COLORS[i % MARKET_COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 truncate">{m.source}</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">{formatSum(m.avgPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Price changes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.priceChanges}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">

          {/* Dropping */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-emerald-50 dark:bg-emerald-950/30">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{t.trends.priceDropped}</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {dropping.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">{t.trends.noData}</p>
              ) : dropping.map(item => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatSum(item.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-emerald-600">{formatSum(Math.abs(item.priceChange))}</p>
                    <p className="text-[10px] font-bold text-emerald-500">{Math.abs(item.pctChange)}%</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Rising */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-rose-50 dark:bg-rose-950/30">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-black text-rose-700 dark:text-rose-400">{t.trends.priceIncreased}</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {rising.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">{t.trends.noData}</p>
              ) : rising.map(item => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatSum(item.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-rose-600">+{formatSum(item.priceChange)}</p>
                    <p className="text-[10px] font-bold text-rose-500">+{item.pctChange}%</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular products */}
      {popular.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-violet-500" />
            <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.mostViewed}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {popular.map((p, rank) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800
                  hover:border-violet-300 dark:hover:border-violet-700
                  hover:shadow-md hover:shadow-violet-500/10
                  transition-all group overflow-hidden"
              >
                <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">
                    {rank + 1}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {p.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs font-black text-violet-600 dark:text-violet-400">{formatSum(p.price)}</p>
                    <div className="flex items-center gap-0.5 text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{p.viewCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Market share visual */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">{t.trends.marketShare}</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          {markets.slice(0, 10).map((m, i) => (
            <div key={m.source} className="flex items-center gap-3">
              <span className="text-xs font-black text-gray-500 dark:text-gray-400 w-24 shrink-0 truncate">{m.source}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(m.productCount / maxMarketCount) * 100}%`,
                    background: MARKET_COLORS[i % MARKET_COLORS.length],
                  }}
                />
              </div>
              <span className="text-xs font-black text-gray-700 dark:text-gray-300 w-12 text-right shrink-0">
                {m.productCount}
              </span>
              <ArrowUpRight className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
