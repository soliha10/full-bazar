import { useState, useEffect } from 'react';
import {
  ArrowRight, TrendingUp, ShieldCheck, RefreshCw,
  Zap, Sparkles, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';
import axios from 'axios';
import { fetchPersonalizedRecommendations } from '../services/api';
import { mapProduct } from '../utils/productMapper';
import { useRecommendations } from '../hooks/useRecommendations';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';

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

const QUICK_CATEGORIES = [
  { emoji: '📱', label: 'Smartfonlar', value: 'smartphones' },
];

/* ── Section header component ── */
function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  linkTo,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  linkTo: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[17px] md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 hidden md:block">{subtitle}</p>
          )}
        </div>
      </div>
      <Link
        to={linkTo}
        className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0 ml-3 whitespace-nowrap"
      >
        {linkLabel}
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ── Small product card for horizontal scroll ── */
function MiniProductCard({
  id,
  image,
  name,
  price,
  badge,
  storeCount,
}: {
  id: string | number;
  image: string;
  name: string;
  price: number;
  badge?: string;
  storeCount?: number;
}) {
  return (
    <Link
      to={`/product/${id}`}
      className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        <img
          src={image}
          alt={name}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/320x320/f5f3ff/7c3aed?text=📱'; }}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-400 mix-blend-multiply dark:mix-blend-normal"
        />
        {badge && (
          <span className="absolute top-2 left-2 bg-violet-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
            {badge}
          </span>
        )}
        {storeCount && storeCount > 1 && (
          <span className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-100 dark:border-gray-700 text-[9px] font-black text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-lg">
            {storeCount} ta
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-[12px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-2 flex-1 min-h-[32px]">
          {name}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-violet-600 dark:text-violet-400 leading-none">
            {formatSum(price)}
          </p>
          <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
            <ArrowRight className="w-3 h-3 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Landing() {
  const { total, products: allProducts } = useProducts(1, 20);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs]         = useState(true);
  const [personalizedRecs, setPersonalizedRecs]   = useState<any[]>([]);
  const [personalizedType, setPersonalizedType]   = useState<string>('');
  const { t } = useLanguage();
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const clientRecs = useRecommendations(allProducts, 6);
  const showClientRecs = clientRecs.length > 0 && (favorites.length > 0 || !!user?.profile.preferredBrands.length);

  useEffect(() => {
    axios.get('/api/recommendations')
      .then(res => setRecommendations(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, []);

  useEffect(() => {
    fetchPersonalizedRecommendations(6)
      .then(data => {
        setPersonalizedRecs((data.products ?? []).map(mapProduct));
        setPersonalizedType(data.type ?? '');
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-0 transition-colors">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="md:px-4 md:pt-8 md:max-w-7xl md:mx-auto">
        <div className="relative md:rounded-3xl overflow-hidden bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 shadow-2xl shadow-violet-500/30 flex flex-col"
          style={{ minHeight: 'clamp(340px, 62vh, 520px)' }}>

          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
            <div className="absolute top-10 right-1/3 w-36 h-36 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-10 w-60 h-60 rounded-full bg-purple-400/10" />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-white/5" />
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center relative z-10 px-5 pt-6 pb-4 md:px-14 md:py-14">
            <div className="w-full flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

              {/* Left / main */}
              <div className="flex-1">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4">
                  <Zap className="w-3 h-3 text-yellow-300 shrink-0" />
                  <span className="text-white/90 text-[11px] font-bold uppercase tracking-widest">
                    {total > 0
                      ? t.landing.hero.productCount.replace('{{count}}', total.toLocaleString())
                      : t.landing.hero.livePrices}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-white font-black leading-[1.12] tracking-tight mb-2.5"
                  style={{ fontSize: 'clamp(1.75rem, 7vw, 3.25rem)' }}>
                  {t.landing.hero.title}
                </h1>

                {/* Subtitle */}
                <p className="text-white/70 text-sm md:text-lg leading-relaxed mb-5 max-w-xs md:max-w-sm">
                  {t.landing.hero.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link to="/products"
                    className="inline-flex items-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-6 py-3 text-sm shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
                    {t.landing.hero.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Desktop right card */}
              <div className="hidden md:flex flex-col gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 min-w-[230px]">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">
                    {t.landing.hero.liveLabel}
                  </p>
                  {['Texnomart', 'Uzum', 'Olcha'].map((store, i) => (
                    <div key={store} className="flex items-center justify-between mb-3 last:mb-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-green-400' : 'bg-white/30'}`} />
                        <span className="text-white/80 text-sm font-medium">{store}</span>
                      </div>
                      <span className={`text-sm font-black ${i === 0 ? 'text-green-300' : 'text-white/50'}`}>
                        {i === 0 ? t.landing.hero.cheapest : `+${i * 8}%`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: total > 0 ? total : '500+', label: t.landing.hero.statsProducts },
                    { value: '21',                       label: t.landing.hero.statsStores },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                      <p className="text-white/60 text-xs font-medium mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile stats strip */}
          <div className="md:hidden relative z-10 px-4 pb-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: total > 0 ? total : '500+', label: t.landing.hero.statsProducts },
                { value: '21',                       label: t.landing.hero.statsStores },
                { value: '24/7',                     label: t.landing.hero.livePrices },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 text-center">
                  <p className="text-lg font-black text-white leading-none">{stat.value}</p>
                  <p className="text-white/60 text-[10px] font-semibold mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORY CHIPS — mobile only
      ══════════════════════════════════════ */}
      <section className="md:hidden px-4 mt-4">
        <div className="flex flex-wrap gap-2">
          {/* All products */}
          <Link to="/products"
            className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-violet-600 text-white text-xs font-black shadow-sm shadow-violet-500/25 active:scale-95 transition-all">
            🔥 Barchasi
          </Link>
          {QUICK_CATEGORIES.map(({ emoji, label, value }) => (
            <Link
              key={value + label}
              to={value ? `/products?category=${value}` : '/products'}
              className="flex items-center gap-1.5 px-4 h-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          TRUST PILLS — mobile only
      ══════════════════════════════════════ */}
      <section className="md:hidden px-4 mt-3">
        <div className="flex flex-wrap gap-2">
          {t.landing.trustBar.map(({ title }, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <div key={idx}
                className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 rounded-full px-3.5 h-8">
                <Icon className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 whitespace-nowrap">{title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          TRUST BAR — desktop only
      ══════════════════════════════════════ */}
      <section className="hidden md:block mt-6 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
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

      {/* ══════════════════════════════════════
          PARTNER MARKETS
      ══════════════════════════════════════ */}
      <section className="mt-5 md:mt-8 bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-800/60 py-4 md:py-8">
        <div className="px-4 max-w-7xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-3">
            {t.landing.markets.label}
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {MARKET_LOGOS.map(({ name, color }) => (
              <Link
                key={name}
                to={`/products?source=${encodeURIComponent(name.toLowerCase())}`}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 rounded-xl px-3 h-9 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          AI BEST DEALS
      ══════════════════════════════════════ */}
      <section className="mt-6 md:mt-10 px-4 max-w-7xl mx-auto">
        <SectionHeader
          title={t.landing.aiRecs.title}
          subtitle={t.landing.aiRecs.subtitle}
          icon={TrendingUp}
          linkTo="/products"
          linkLabel={t.landing.trending.viewAll}
        />

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {loadingRecs
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="shrink-0 w-[160px] md:w-auto aspect-3/4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
              ))
            : recommendations.map(p => (
                <MiniProductCard
                  key={p.id}
                  id={p.id}
                  image={p.image}
                  name={p.name}
                  price={p.price}
                  badge={t.landing.aiRecs.badge}
                />
              ))}
          {!loadingRecs && recommendations.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              {t.landing.aiRecs.empty}
            </p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          PERSONALIZED — client-side AI recs
      ══════════════════════════════════════ */}
      {showClientRecs && (
        <section className="mt-6 md:mt-12 px-4 max-w-7xl mx-auto">
          <SectionHeader
            title="Siz uchun tavsiyalar"
            subtitle={favorites.length > 0 ? "Sevimlilaringizga asoslanib tanlandi" : "Profilingizga mos mahsulotlar"}
            icon={Sparkles}
            linkTo="/products"
            linkLabel={t.landing.trending.viewAll}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
            {clientRecs.map(p => (
              <MiniProductCard
                key={p.id}
                id={p.id}
                image={p.image}
                name={p.name}
                price={p.price}
                storeCount={p.markets?.length}
              />
            ))}
          </div>
        </section>
      )}

      {/* server personalized — shown only when client recs absent */}
      {!showClientRecs && personalizedRecs.length > 0 && personalizedType === 'personalized' && (
        <section className="mt-6 md:mt-12 px-4 max-w-7xl mx-auto">
          <SectionHeader
            title="Sizga maxsus"
            subtitle="Ko'rgan mahsulotlaringizga asoslanib"
            icon={Sparkles}
            linkTo="/products"
            linkLabel={t.landing.trending.viewAll}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
            {personalizedRecs.map(p => (
              <MiniProductCard key={p.id} id={p.id} image={p.image} name={p.name} price={p.price} />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="mt-8 md:mt-20 bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-800/60 py-7 md:py-16">
        <div className="px-4 max-w-7xl mx-auto">
          <h2 className="font-black text-gray-900 dark:text-white text-[17px] md:text-2xl mb-5 md:mb-8 text-center tracking-tight">
            {t.landing.howItWorks.title}
          </h2>

          {/* Mobile: vertical list */}
          <div className="flex flex-col gap-3 md:hidden">
            {t.landing.howItWorks.steps.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-violet-500/25 mt-0.5">
                  {idx + 1}
                </div>
                <div className="pt-0.5">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm mb-0.5">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {t.landing.howItWorks.steps.map((item, idx) => (
              <div key={idx} className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-lg mb-4 shadow-lg shadow-violet-500/30">
                  {idx + 1}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                {idx < 2 && (
                  <div className="absolute top-10 -right-4 z-10 text-violet-300 dark:text-violet-700">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════ */}
      <section className="px-4 py-7 md:py-10 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 p-6 md:p-12 shadow-xl shadow-violet-500/20">
          {/* Blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-white font-black text-xl md:text-3xl tracking-tight mb-1.5 md:mb-2">
                {t.landing.cta.title}
              </h2>
              <p className="text-white/70 text-sm md:text-base max-w-md">
                {t.landing.cta.subtitle
                  .replace('{{count}}', total > 0 ? total.toLocaleString() : '500+')
                  .replace('{{stores}}', '21')}
              </p>
            </div>
            <Link
              to="/products"
              className="flex items-center justify-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-3.5 text-sm md:text-base shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 w-full md:w-auto"
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
