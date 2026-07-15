import { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import {
  ArrowRight, TrendingUp, ShieldCheck, RefreshCw,
  Zap, Sparkles, ChevronRight, ChevronLeft,
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

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

/* ── Section header ── */
function SectionHeader({
  title, subtitle, icon: Icon, linkTo, linkLabel,
}: {
  title: string; subtitle?: string; icon?: React.ElementType;
  linkTo: string; linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-5">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[17px] md:text-[22px] font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-[13px] mt-0.5 hidden md:block">{subtitle}</p>
          )}
        </div>
      </div>
      <Link
        to={linkTo}
        className="flex items-center gap-1 text-xs md:text-[13px] font-bold text-violet-600 dark:text-violet-400 shrink-0 ml-3 whitespace-nowrap hover:underline"
      >
        {linkLabel}
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function Carousel({ children }: { children: React.ReactNode[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const lastWheel = useRef(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!emblaApi) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheel.current < 250) return;
    lastWheel.current = now;
    if (e.deltaY > 0) emblaApi.scrollNext();
    else emblaApi.scrollPrev();
  }, [emblaApi]);

  return (
    <div className="relative" onWheel={handleWheel}>
      <div className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {children}
        </div>
      </div>

      {canPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-9 h-9 items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:bg-violet-50 dark:hover:bg-violet-900/40 hover:border-violet-300 dark:hover:border-violet-700 transition-all z-10"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      {canNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-9 h-9 items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:bg-violet-50 dark:hover:bg-violet-900/40 hover:border-violet-300 dark:hover:border-violet-700 transition-all z-10"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
}

/* ── Product card inside carousel ── */
function MiniProductCard({
  id, image, name, price, badge, storeCount,
}: {
  id: string | number; image: string; name: string;
  price: number; badge?: string; storeCount?: number;
}) {
  return (
    <Link
      to={`/product/${id}`}
      className="shrink-0 w-[152px] md:w-[210px] group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/12 hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-700/60 active:scale-[0.97] transition-all duration-200"
    >
      {/* Image — fixed height so text gets real estate */}
      <div className="relative h-36 md:h-44 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        <img
          src={image}
          alt={name}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/320x320/f5f3ff/7c3aed?text=📱'; }}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
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
      <div className="p-2.5 md:p-3.5 flex flex-col flex-1 gap-2">
        <p className="text-[12px] md:text-[14px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug flex-1 min-h-[34px] md:min-h-[40px]">
          {name}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[14px] md:text-[16px] font-black text-violet-600 dark:text-violet-400 leading-none">
            {formatSum(price)}
          </p>
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-600 transition-colors shrink-0">
            <ArrowRight className="w-3 h-3 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Skeleton card for loading state ── */
function SkeletonCard() {
  return (
    <div className="shrink-0 w-[152px] md:w-[210px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse overflow-hidden">
      <div className="h-36 md:h-44 bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/5" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-2/5 mt-3" />
      </div>
    </div>
  );
}

export function Landing() {
  const { total, products: allProducts } = useProducts(1, 20);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs]           = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);
  const [personalizedType, setPersonalizedType] = useState<string>('');
  const { t } = useLanguage();
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const clientRecs = useRecommendations(allProducts, 8);
  const showClientRecs = clientRecs.length > 0 && (favorites.length > 0 || !!user?.profile.preferredBrands.length);

  useEffect(() => {
    axios.get('/api/recommendations')
      .then(res => setRecommendations(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, []);

  useEffect(() => {
    fetchPersonalizedRecommendations(8)
      .then(data => {
        setPersonalizedRecs((data.products ?? []).map(mapProduct));
        setPersonalizedType(data.type ?? '');
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-0 transition-colors">

      {/* ══ HERO ══ */}
      <section className="md:px-4 md:pt-8 md:max-w-7xl md:mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative md:rounded-3xl overflow-hidden bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 shadow-2xl shadow-violet-500/30 flex flex-col"
          style={{ minHeight: 'clamp(340px, 62vh, 520px)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.05, 0.08, 0.05] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white"
            />
            <div className="absolute top-10 right-1/3 w-36 h-36 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-10 w-60 h-60 rounded-full bg-purple-400/10" />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-white/5" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center relative z-10 px-5 pt-6 pb-4 md:px-14 md:py-14">
            <div className="w-full flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

              {/* Left */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4"
                >
                  <Zap className="w-3 h-3 text-yellow-300 shrink-0" />
                  <span className="text-white/90 text-[11px] font-bold uppercase tracking-widest">
                    {total > 0
                      ? t.landing.hero.productCount.replace('{{count}}', total.toLocaleString())
                      : t.landing.hero.livePrices}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.55 }}
                  className="text-white font-black leading-[1.12] tracking-tight mb-2.5"
                  style={{ fontSize: 'clamp(1.75rem, 7vw, 3.25rem)' }}
                >
                  {t.landing.hero.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.38, duration: 0.5 }}
                  className="text-white/70 text-sm md:text-lg leading-relaxed mb-5 max-w-xs md:max-w-sm"
                >
                  {t.landing.hero.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48, duration: 0.45 }}
                >
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-6 py-3 text-sm shadow-xl shadow-black/20 hover:scale-105 hover:shadow-2xl active:scale-95 transition-all"
                  >
                    {t.landing.hero.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>

              {/* Desktop right card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                className="hidden md:flex flex-col gap-3 shrink-0"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 min-w-[260px]">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">
                    {t.landing.hero.liveLabel}
                  </p>
                  {['Texnomart', 'Glotr', 'Olcha'].map((store, i) => (
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
                    { value: '19',                       label: t.landing.hero.statsStores },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                      <p className="text-white/60 text-xs font-medium mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="md:hidden relative z-10 px-4 pb-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: total > 0 ? total : '500+', label: t.landing.hero.statsProducts },
                { value: '19',                       label: t.landing.hero.statsStores },
                { value: '24/7',                     label: t.landing.hero.livePrices },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 text-center">
                  <p className="text-lg font-black text-white leading-none">{stat.value}</p>
                  <p className="text-white/60 text-[10px] font-semibold mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ CATEGORY CHIPS — mobile ══ */}
      <section className="md:hidden px-4 mt-4">
        <div className="flex flex-wrap gap-2">
          <Link to="/products"
            className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-violet-600 text-white text-xs font-black shadow-sm shadow-violet-500/25 active:scale-95 transition-all">
            🔥 Barchasi
          </Link>
          {QUICK_CATEGORIES.map(({ emoji, label, value }) => (
            <Link
              key={value}
              to={value ? `/products?category=${value}` : '/products'}
              className="flex items-center gap-1.5 px-4 h-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ TRUST PILLS — mobile ══ */}
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

      {/* ══ TRUST BAR — desktop ══ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" transition={{ duration: 0.55, ease: "easeOut" }} viewport={{ once: true }}
        className="hidden md:block mt-6 px-4 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-3 gap-4">
          {t.landing.trustBar.map(({ title, desc }, idx) => {
            const Icon = TRUST_ICONS[idx];
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(139,92,246,0.15)' }}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl px-4 py-4 shadow-sm border border-violet-100/60 dark:border-violet-900/30 cursor-default transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[14px] font-black text-gray-900 dark:text-white">{title}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ══ PARTNER MARKETS — infinite marquee ══ */}
      <section className="mt-5 md:mt-8 bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-800/60 py-4 md:py-6 overflow-hidden">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-3 px-4">
          {t.landing.markets.label}
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-gray-50 dark:from-gray-900/60 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-gray-50 dark:from-gray-900/60 to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            className="flex gap-2 w-max"
            style={{ willChange: 'transform' }}
          >
            {[...MARKET_LOGOS, ...MARKET_LOGOS].map(({ name, color }, i) => (
              <Link
                key={`${name}-${i}`}
                to={`/products?source=${encodeURIComponent(name.toLowerCase())}`}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 rounded-xl px-3 h-9 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150 shrink-0"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">{name}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ AI BEST DEALS — carousel ══ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" transition={{ duration: 0.55, ease: "easeOut" }} viewport={{ once: true, margin: '-60px' }}
        className="mt-6 md:mt-10 px-4 max-w-7xl mx-auto"
      >
        <SectionHeader
          title={t.landing.aiRecs.title}
          subtitle={t.landing.aiRecs.subtitle}
          icon={TrendingUp}
          linkTo="/products"
          linkLabel={t.landing.trending.viewAll}
        />

        <Carousel>
          {loadingRecs
            ? Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : recommendations.length > 0
              ? recommendations.slice(0, 6).map(p => (
                  <MiniProductCard
                    key={p.id} id={p.id} image={p.image}
                    name={p.name} price={p.price}
                    badge={t.landing.aiRecs.badge}
                  />
                ))
              : [
                  <p key="empty" className="py-10 text-center text-sm text-gray-400 dark:text-gray-500 w-full">
                    {t.landing.aiRecs.empty}
                  </p>,
                ]
          }
        </Carousel>
      </motion.section>

      {/* ══ CLIENT RECS — carousel ══ */}
      {showClientRecs && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" transition={{ duration: 0.55, ease: "easeOut" }} viewport={{ once: true, margin: '-60px' }}
          className="mt-6 md:mt-12 px-4 max-w-7xl mx-auto"
        >
          <SectionHeader
            title="Siz uchun tavsiyalar"
            subtitle={favorites.length > 0 ? 'Sevimlilaringizga asoslanib tanlandi' : 'Profilingizga mos mahsulotlar'}
            icon={Sparkles}
            linkTo="/products"
            linkLabel={t.landing.trending.viewAll}
          />
          <Carousel>
            {clientRecs.map(p => (
              <MiniProductCard
                key={p.id} id={p.id} image={p.image}
                name={p.name} price={p.price}
                storeCount={p.markets?.length}
              />
            ))}
          </Carousel>
        </motion.section>
      )}

      {/* ══ SERVER PERSONALIZED — carousel ══ */}
      {!showClientRecs && personalizedRecs.length > 0 && personalizedType === 'personalized' && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" transition={{ duration: 0.55, ease: "easeOut" }} viewport={{ once: true, margin: '-60px' }}
          className="mt-6 md:mt-12 px-4 max-w-7xl mx-auto"
        >
          <SectionHeader
            title="Sizga maxsus"
            subtitle="Ko'rgan mahsulotlaringizga asoslanib"
            icon={Sparkles}
            linkTo="/products"
            linkLabel={t.landing.trending.viewAll}
          />
          <Carousel>
            {personalizedRecs.map(p => (
              <MiniProductCard key={p.id} id={p.id} image={p.image} name={p.name} price={p.price} />
            ))}
          </Carousel>
        </motion.section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" transition={{ duration: 0.55, ease: "easeOut" }} viewport={{ once: true, margin: '-60px' }}
        className="mt-8 md:mt-20 bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-800/60 py-7 md:py-16"
      >
        <div className="px-4 max-w-7xl mx-auto">
          <h2 className="font-black text-gray-900 dark:text-white text-[17px] md:text-[26px] mb-5 md:mb-10 text-center tracking-tight">
            {t.landing.howItWorks.title}
          </h2>

          {/* Mobile */}
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

          {/* Desktop */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {t.landing.howItWorks.steps.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.5 }}
                whileHover={{ y: -4, boxShadow: '0 16px 32px -8px rgba(139,92,246,0.18)' }}
                className="relative bg-white dark:bg-gray-800 rounded-3xl p-7 border border-gray-100 dark:border-gray-700 shadow-sm transition-shadow cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-xl mb-5 shadow-lg shadow-violet-500/30">
                  {idx + 1}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-[16px] mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-[13px] leading-relaxed">{item.desc}</p>
                {idx < 2 && (
                  <div className="absolute top-10 -right-4 z-10 text-violet-300 dark:text-violet-700">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ══ BOTTOM CTA ══ */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible" transition={{ duration: 0.55, ease: "easeOut" }} viewport={{ once: true, margin: '-40px' }}
        className="px-4 py-7 md:py-12 max-w-7xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-violet-900 p-6 md:p-14 shadow-xl shadow-violet-500/20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-white"
            />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-white font-black text-xl md:text-[32px] tracking-tight mb-1.5 md:mb-2">
                {t.landing.cta.title}
              </h2>
              <p className="text-white/70 text-sm md:text-[15px] max-w-md">
                {t.landing.cta.subtitle
                  .replace('{{count}}', total > 0 ? total.toLocaleString() : '500+')
                  .replace('{{stores}}', '21')}
              </p>
            </div>
            <Link
              to="/products"
              className="flex items-center justify-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-3.5 text-sm md:text-base shadow-lg hover:scale-105 hover:shadow-2xl active:scale-95 transition-all shrink-0 w-full md:w-auto"
            >
              {t.landing.cta.button}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
