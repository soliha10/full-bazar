import { useState, useEffect } from 'react';
import { Smartphone, Star, ArrowRight, TrendingUp, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';
import axios from 'axios';

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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-0 transition-colors">

      {/* ── Hero ── */}
      <section className="px-4 pt-4 md:pt-10 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 shadow-2xl shadow-violet-500/30 min-h-[320px] md:min-h-[420px] flex items-center">

          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
            <div className="absolute top-10 right-1/3 w-40 h-40 rounded-full bg-violet-300/10" />
            <div className="absolute -bottom-10 right-10 w-60 h-60 rounded-full bg-purple-400/10" />
          </div>

          <div className="relative z-10 px-6 py-10 md:px-14 md:py-16 w-full flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-5">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white/90 text-xs font-bold uppercase tracking-widest">
                  {total > 0
                    ? t.landing.hero.productCount.replace('{{count}}', total.toLocaleString())
                    : t.landing.hero.livePrices}
                </span>
              </div>

              <h1 className="text-white text-3xl md:text-5xl font-black leading-tight mb-4 tracking-tight max-w-lg">
                {t.landing.hero.title}
              </h1>
              <p className="text-white/80 text-sm md:text-lg mb-8 max-w-sm leading-relaxed">
                {t.landing.hero.subtitle}
              </p>

              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-4 text-sm md:text-base shadow-lg hover:shadow-white/25 hover:scale-105 active:scale-95 transition-all"
              >
                {t.landing.hero.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right stats card */}
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
      </section>

      {/* ── Trust bar ── */}
      <section className="mt-5 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {t.landing.trustBar.map(({ title, desc }, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl px-4 py-4 shadow-sm border border-violet-100/60 dark:border-violet-900/30">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
                </div>
                <p className="sm:hidden text-xs font-black text-gray-800 dark:text-gray-200">{title}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Market logos ── */}
      <section className="mt-8 bg-gray-50 dark:bg-gray-900/60 py-8 border-y border-violet-100/40 dark:border-violet-900/20">
        <div className="px-4 max-w-7xl mx-auto">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-5">
            {t.landing.markets.label}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {MARKET_LOGOS.map(({ name, color }) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-black text-gray-800 dark:text-gray-100">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Recommendations: Best Deals ── */}
      <section className="mt-10 px-4 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-12 border border-violet-100 dark:border-violet-900/40 shadow-xl shadow-violet-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Zap size={200} className="text-violet-600" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {t.landing.aiRecs.title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {t.landing.aiRecs.subtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {loadingRecs ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
                ))
              ) : (
                recommendations.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="group bg-gray-50 dark:bg-gray-800/60 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-square bg-white dark:bg-gray-900 rounded-2xl mb-4 overflow-hidden p-4 border border-gray-100 dark:border-gray-700">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
                      />
                    </div>
                    <div className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-[10px] font-black px-2.5 py-1 rounded-lg inline-block mb-2">
                      {t.landing.aiRecs.badge}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-3">{p.name}</h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">{t.landing.aiRecs.lowestPrice}</p>
                        <p className="text-lg font-black text-violet-600 dark:text-violet-400">{formatSum(p.price)}</p>
                      </div>
                      <div className="bg-violet-600 group-hover:bg-violet-700 p-2 rounded-xl text-white transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
              {!loadingRecs && recommendations.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                  {t.landing.aiRecs.empty}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending products ── */}
      <section className="mt-10 md:mt-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-xl md:text-2xl tracking-tight">
              {t.landing.trending.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t.landing.trending.subtitle}
            </p>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            {t.landing.trending.viewAll}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {isLoading && featuredProducts.length === 0
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
                  <div className="p-4 space-y-2">
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
                    className="group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700 flex flex-col"
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'}
                        alt={product.name}
                        className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
                      />
                      {sortedMarkets.length > 1 && (
                        <div className="absolute top-3 left-3 bg-violet-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-violet-500/30">
                          {t.landing.trending.storesBadge.replace('{{count}}', String(sortedMarkets.length))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-200">{product.rating}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">({product.reviews})</span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-3 flex-1">
                        {product.name}
                      </h3>

                      {sortedMarkets.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {sortedMarkets.slice(0, 2).map((m, idx) => (
                            <div key={m.source} className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${
                              idx === 0
                                ? 'bg-violet-50 dark:bg-violet-950/50'
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}>
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                idx === 0
                                  ? 'text-violet-700 dark:text-violet-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {idx === 0 ? '✓ ' : ''}{m.source}
                              </span>
                              <span className={`text-xs font-black ${
                                idx === 0
                                  ? 'text-violet-700 dark:text-violet-400'
                                  : 'text-gray-500 dark:text-gray-400'
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

                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.landing.trending.cheapest}</p>
                          <p className="text-base font-black text-gray-900 dark:text-white">{formatSum(bestPrice)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center group-hover:bg-violet-600 transition-colors shadow-sm">
                          <ArrowRight className="w-4 h-4 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-14 md:mt-20 bg-gray-50 dark:bg-gray-900/60 border-y border-violet-100/40 dark:border-violet-900/20 py-12 md:py-16">
        <div className="px-4 max-w-7xl mx-auto">
          <h2 className="font-black text-gray-900 dark:text-white text-xl md:text-2xl mb-8 text-center tracking-tight">
            {t.landing.howItWorks.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {t.landing.howItWorks.steps.map((item, idx) => (
              <div
                key={idx}
                className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all"
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
      <section className="px-4 py-10 max-w-7xl mx-auto">
        <div className="bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl shadow-violet-500/25">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-500/20" />
          </div>
          <div className="relative z-10">
            <Smartphone className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h2 className="text-white font-black text-2xl md:text-3xl mb-3 tracking-tight">
              {t.landing.cta.title}
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-7 max-w-md mx-auto">
              {t.landing.cta.subtitle
                .replace('{{count}}', total > 0 ? total.toLocaleString() : '500+')
                .replace('{{stores}}', '21')}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-4 text-base shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {t.landing.cta.button}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
