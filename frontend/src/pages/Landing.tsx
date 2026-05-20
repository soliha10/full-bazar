import { useState, useEffect } from 'react';
import { Smartphone, Star, ArrowRight, TrendingUp, ShieldCheck, RefreshCw, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';
import axios from 'axios';
import { fetchPersonalizedRecommendations } from '../services/api';
import { mapProduct } from '../utils/productMapper';

const MARKET_LOGOS: { name: string; color: string }[] = [
  { name: 'Asaxiy',     color: '#7C3AED' },
  { name: 'Texnomart',  color: '#E31E24' },
  { name: 'Olcha',      color: '#F97316' },
  { name: 'Mediapark',  color: '#10B981' },
  { name: 'Glotr',      color: '#8B5CF6' },
  { name: 'Idea',       color: '#F59E0B' },
  { name: 'Ozon',       color: '#005BFF' },
  { name: 'Discont',    color: '#EF4444' },
  { name: 'Premier',    color: '#6D28D9' },
  { name: 'Beemarket',  color: '#EC4899' },
  { name: 'Castore',    color: '#14B8A6' },
  { name: 'Macbro',     color: '#374151' },
  { name: 'Radius',     color: '#DC2626' },
  { name: 'Joybox',     color: '#7C3AED' },
  { name: 'Openshop',   color: '#059669' },
  { name: 'Mi Store',   color: '#FF6900' },
  { name: 'Prom',       color: '#2563EB' },
  { name: 'Alif',       color: '#0F766E' },
  { name: 'Ucell Shop', color: '#16A34A' },
  { name: 'Brandstore', color: '#9333EA' },
  { name: 'OLX',        color: '#3D9B35' },
];

const TRUST_ICONS = [RefreshCw, ShieldCheck, TrendingUp];

export function Landing() {
  const { products: allProducts, isLoading, total } = useProducts(1, 8);
  const featuredProducts = allProducts.slice(0, 4);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);
  const [personalizedType, setPersonalizedType] = useState<string>('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await axios.get('/api/recommendations');
        setRecommendations(res.data.products || []);
      } catch {
        // silent
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, []);

  useEffect(() => {
    fetchPersonalizedRecommendations(6)
      .then((data) => {
        setPersonalizedRecs((data.products ?? []).map(mapProduct));
        setPersonalizedType(data.type ?? '');
      })
      .catch(() => {});
  }, []);

  const quickCategories = [
    { label: (t.detail.categories as any).all,         value: '' },
    { label: (t.detail.categories as any).smartphones, value: 'smartphones' },
    { label: (t.detail.categories as any).phones,      value: 'phones' },
    { label: (t.detail.categories as any).electronics, value: 'electronics' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20 md:pb-0 transition-colors">

      {/* ── Hero ── */}
      <section className="md:px-4 md:pt-8 md:max-w-7xl md:mx-auto">
        <div className="relative md:rounded-3xl overflow-hidden bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 shadow-2xl shadow-violet-500/30 min-h-[68vh] md:min-h-[420px] flex flex-col">

          {/* Background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
            <div className="absolute top-8 right-1/3 w-36 h-36 rounded-full bg-violet-300/10" />
            <div className="absolute -bottom-8 right-8 w-56 h-56 rounded-full bg-purple-400/10" />
            <div className="absolute top-1/2 left-1/4 w-28 h-28 rounded-full bg-white/3" />
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center relative z-10 px-5 py-8 md:px-14 md:py-14">
            <div className="w-full flex flex-col md:flex-row md:items-center gap-8">

              <div className="flex-1">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 mb-5">
                  <Zap className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                  <span className="text-white/90 text-xs font-bold uppercase tracking-widest">
                    {total > 0
                      ? t.landing.hero.productCount.replace('{{count}}', total.toLocaleString())
                      : t.landing.hero.livePrices}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-white text-[2rem] sm:text-4xl md:text-5xl font-black leading-[1.15] mb-3 tracking-tight max-w-sm md:max-w-lg">
                  {t.landing.hero.title}
                </h1>
                <p className="text-white/70 text-sm md:text-lg mb-6 max-w-xs md:max-w-sm leading-relaxed">
                  {t.landing.hero.subtitle}
                </p>

                {/* CTA */}
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-7 py-3.5 text-sm md:text-base shadow-xl shadow-black/20 hover:shadow-white/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {t.landing.hero.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Desktop stats card */}
              <div className="hidden md:flex flex-col gap-4 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 min-w-[240px]">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">{t.landing.hero.liveLabel}</p>
                  {['Texnomart', 'Uzum', 'Olcha'].map((store, i) => (
                    <div key={store} className="flex items-center justify-between mb-3 last:mb-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-400' : 'bg-white/40'}`} />
                        <span className="text-white/80 text-sm font-medium">{store}</span>
                      </div>
                      <span className={`text-sm font-black ${i === 0 ? 'text-green-300' : 'text-white/60'}`}>
                        {i === 0 ? t.landing.hero.cheapest : `+${i * 8}%`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{total > 0 ? total : '500'}+</p>
                    <p className="text-white/60 text-xs font-medium mt-1">{t.landing.hero.statsProducts}</p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-white">21</p>
                    <p className="text-white/60 text-xs font-medium mt-1">{t.landing.hero.statsStores}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile bottom stats */}
          <div className="md:hidden relative z-10 px-5 pb-7">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/12 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                <p className="text-xl font-black text-white">{total > 0 ? total : '500'}+</p>
                <p className="text-white/60 text-[10px] font-semibold mt-0.5 leading-tight">{t.landing.hero.statsProducts}</p>
              </div>
              <div className="bg-white/12 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                <p className="text-xl font-black text-white">21</p>
                <p className="text-white/60 text-[10px] font-semibold mt-0.5 leading-tight">{t.landing.hero.statsStores}</p>
              </div>
              <div className="bg-white/12 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                <p className="text-xl font-black text-white">24/7</p>
                <p className="text-white/60 text-[10px] font-semibold mt-0.5 leading-tight">{t.landing.hero.livePrices}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick category chips — mobile ── */}
      <section className="md:hidden px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickCategories.map(({ label, value }) => (
            <Link
              key={value}
              to={value ? `/products?category=${value}` : '/products'}
              className={`shrink-0 px-4 py-2.5 min-h-[40px] rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center border ${
                value === ''
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trust bar — desktop ── */}
      <section className="hidden md:block mt-6 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-5">
          {t.landing.trustBar.map(({ title, desc }, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl px-4 py-4 shadow-sm border border-violet-100/60 dark:border-violet-900/30">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Trust pills — mobile ── */}
      <section className="md:hidden px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {t.landing.trustBar.map(({ title }, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <div key={idx} className="shrink-0 flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 rounded-full px-3.5 py-2">
                <Icon className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="text-[11px] font-black text-violet-700 dark:text-violet-300 whitespace-nowrap">{title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Market logos ── */}
      <section className="mt-6 md:mt-8 bg-gray-50 dark:bg-gray-900/60 py-5 md:py-8 border-y border-violet-100/40 dark:border-violet-900/20">
        <div className="px-4 max-w-7xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-3.5">
            {t.landing.markets.label}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 pr-4 md:flex-wrap md:justify-center md:overflow-visible md:pb-0 md:pr-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MARKET_LOGOS.map(({ name, color }) => (
              <Link
                key={name}
                to={`/products?source=${encodeURIComponent(name.toLowerCase())}`}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 rounded-xl px-3.5 py-2.5 min-h-[40px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shrink-0 active:scale-95"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Best Deals ── */}
      <section className="mt-7 md:mt-10 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="text-[17px] md:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                {t.landing.aiRecs.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 hidden md:block">
                {t.landing.aiRecs.subtitle}
              </p>
            </div>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0">
            {t.landing.trending.viewAll}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 pr-4 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0 md:pr-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loadingRecs
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="shrink-0 w-[160px] md:w-auto h-56 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
              ))
            : recommendations.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="shrink-0 w-[160px] md:w-auto group bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <div className="aspect-square bg-white dark:bg-gray-900 rounded-xl mb-2.5 overflow-hidden p-2 border border-gray-100 dark:border-gray-700">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
                    />
                  </div>
                  <div className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-[9px] font-black px-2 py-0.5 rounded-lg inline-block mb-1.5">
                    {t.landing.aiRecs.badge}
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-snug">{p.name}</h3>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-black text-violet-600 dark:text-violet-400 truncate">{formatSum(p.price)}</p>
                    <div className="bg-violet-600 group-hover:bg-violet-700 p-1.5 rounded-lg text-white transition-colors shrink-0">
                      <ArrowRight size={10} />
                    </div>
                  </div>
                </Link>
              ))
          }
          {!loadingRecs && recommendations.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
              {t.landing.aiRecs.empty}
            </div>
          )}
        </div>
      </section>

      {/* ── Personalized Recommendations ── */}
      {personalizedRecs.length > 0 && personalizedType === 'personalized' && (
        <section className="mt-8 md:mt-12 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-[17px] md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                Sizga maxsus
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 hidden md:block">
                Ko'rgan mahsulotlaringizga asoslanib tavsiya etildi
              </p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:pb-0">
            {personalizedRecs.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="shrink-0 w-[145px] md:w-auto group bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              >
                <div className="aspect-square bg-white dark:bg-gray-900 rounded-xl mb-2 overflow-hidden p-2 border border-gray-100 dark:border-gray-700">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x120?text=No+image'; }}
                  />
                </div>
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white line-clamp-2 mb-1.5 leading-snug">{p.name}</h3>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-black text-violet-600 dark:text-violet-400 truncate">{formatSum(p.price)}</p>
                  <div className="bg-violet-600 group-hover:bg-violet-700 p-1 rounded-lg text-white transition-colors shrink-0">
                    <ArrowRight size={10} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Trending products ── */}
      <section className="mt-8 md:mt-14 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-[17px] md:text-2xl tracking-tight leading-tight">
              {t.landing.trending.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 hidden md:block">
              {t.landing.trending.subtitle}
            </p>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0">
            {t.landing.trending.viewAll}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 pr-4 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0 md:pr-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading && featuredProducts.length === 0
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="shrink-0 w-[165px] md:w-auto bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))
            : featuredProducts.map((product) => {
                const sortedMarkets = [...(product.markets || [])].sort((a, b) => a.price - b.price);
                const bestPrice = sortedMarkets[0]?.price ?? product.price;

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="shrink-0 w-[165px] md:w-auto group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700 flex flex-col"
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
                      />
                      {sortedMarkets.length > 1 && (
                        <div className="absolute top-2 left-2 bg-violet-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm shadow-violet-500/30">
                          {t.landing.trending.storesBadge.replace('{{count}}', String(sortedMarkets.length))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-200">{product.rating}</span>
                      </div>

                      <h3 className="text-[12px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-2 flex-1">
                        {product.name}
                      </h3>

                      {/* Desktop market rows */}
                      {sortedMarkets.length > 0 && (
                        <div className="hidden md:block space-y-1 mb-3">
                          {sortedMarkets.slice(0, 2).map((m, idx) => (
                            <div key={m.source} className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${
                              idx === 0 ? 'bg-violet-50 dark:bg-violet-950/50' : 'bg-gray-50 dark:bg-gray-800'
                            }`}>
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                idx === 0 ? 'text-violet-700 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {idx === 0 ? '✓ ' : ''}{m.source}
                              </span>
                              <span className={`text-xs font-black ${
                                idx === 0 ? 'text-violet-700 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatSum(m.price)}
                              </span>
                            </div>
                          ))}
                          {sortedMarkets.length > 2 && (
                            <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold text-right px-1">
                              {t.landing.trending.moreOffers.replace('{{count}}', String(sortedMarkets.length - 2))}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-gray-900 dark:text-white">{formatSum(bestPrice)}</p>
                        <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center group-hover:bg-violet-600 transition-colors shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-10 md:mt-20 bg-gray-50 dark:bg-gray-900/60 border-y border-violet-100/40 dark:border-violet-900/20 py-8 md:py-16">
        <div className="px-4 max-w-7xl mx-auto">
          <h2 className="font-black text-gray-900 dark:text-white text-[17px] md:text-2xl mb-5 md:mb-8 text-center tracking-tight">
            {t.landing.howItWorks.title}
          </h2>

          {/* Mobile: vertical steps */}
          <div className="flex flex-col gap-3 md:hidden">
            {t.landing.howItWorks.steps.map((item, idx) => (
              <div
                key={idx}
                className="relative flex items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-violet-500/25">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm mb-0.5">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: horizontal */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {t.landing.howItWorks.steps.map((item, idx) => (
              <div
                key={idx}
                className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-lg mb-4 shadow-lg shadow-violet-500/30">
                  {idx + 1}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 z-10 text-violet-300 dark:text-violet-700">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 py-8 md:py-10 max-w-7xl mx-auto">
        <div className="bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center relative overflow-hidden shadow-xl shadow-violet-500/20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
          </div>
          <div className="relative z-10">
            <Smartphone className="w-10 h-10 md:w-12 md:h-12 text-white/80 mx-auto mb-3 md:mb-4" />
            <h2 className="text-white font-black text-xl md:text-3xl mb-2 md:mb-3 tracking-tight">
              {t.landing.cta.title}
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-6 md:mb-7 max-w-md mx-auto">
              {t.landing.cta.subtitle
                .replace('{{count}}', total > 0 ? total.toLocaleString() : '500+')
                .replace('{{stores}}', '21')}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-3.5 md:py-4 text-sm md:text-base shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {t.landing.cta.button}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
