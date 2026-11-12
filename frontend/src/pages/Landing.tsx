import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
// m + LazyMotion: to'liq `motion` bosh sahifa bundle'iga ~30 KB (gzip) qo'shardi
import { m, LazyMotion } from 'framer-motion';
import {
  ArrowRight, TrendingDown, Search, Store, Smartphone, Clock, Layers,
  ChevronRight, ChevronLeft, ChevronDown, Sparkles, RotateCcw, Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum, mapProduct } from '../utils/productMapper';
import { fetchPersonalizedRecommendations } from '../services/api';
import { useRecommendations } from '../hooks/useRecommendations';
import { useFavorites } from '../hooks/useFavorites';
import { useBrands, BRAND_COLORS } from '../hooks/useBrands';
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../contexts/AuthContext';
import { SEO, SITE_URL } from '../components/SEO';
import { productPath } from '../utils/slug';
import type { Product } from '../components/ProductCard';

const loadMotionFeatures = () => import('../utils/motionFeatures').then(r => r.default);

/*
 * Bosh sahifadagi HAR BIR raqam va ro'yxat API dan keladi:
 *   /api/stats            — mahsulot, do'kon, solishtirsa bo'ladigan modellar, oxirgi yangilanish
 *   /api/markets          — do'konlar va takliflar soni (hooks/useMarkets)
 *   /api/brands           — brendlar va modellar soni (hooks/useBrands)
 *   /api/recommendations  — do'konlar orasidagi eng katta narx farqi (haqiqiy narxlar)
 * Ilgari "19 ta do'kon", "500+", "Glotr +8%" kabi qiymatlar qo'lda yozilgan edi.
 * Ma'lumot kelmasa — o'ylab topilgan qiymat emas, skelet yoki xato ko'rsatiladi.
 */

interface Stats {
  products: number;
  markets: number;
  offers: number;
  comparableProducts: number;
  lastUpdated: string | null;
}

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
const reveal = {
  variants: fadeUp, initial: 'hidden', whileInView: 'visible',
  transition: { duration: 0.5, ease: 'easeOut' }, viewport: { once: true, margin: '-60px' },
} as const;

// Raqam kelmagan bo'lsa (masalan, API eski versiyada) — "—", hech qachon taxmin emas
const fmt = (n: number | null | undefined) => (typeof n === 'number' ? n.toLocaleString('ru-RU').replace(/,/g, ' ') : '—');

/* ── Section header ── */
function SectionHeader({
  title, subtitle, icon: Icon, linkTo, linkLabel, id,
}: {
  title: string; subtitle?: string; icon?: React.ElementType;
  linkTo?: string; linkLabel?: string; id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 md:mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 id={id} className="text-lg md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {linkTo && linkLabel && (
        <Link to={linkTo}
          className="flex items-center gap-1 text-xs md:text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0 whitespace-nowrap hover:underline">
          {linkLabel}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function Carousel({ children }: { children: React.ReactNode[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const arrow = 'hidden md:flex absolute top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all z-10';
  return (
    <div className="relative">
      <div className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">{children}</div>
      </div>
      {canPrev && (
        <button type="button" onClick={() => emblaApi?.scrollPrev()} className={`${arrow} left-0 -translate-x-5`} aria-label="Previous">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      {canNext && (
        <button type="button" onClick={() => emblaApi?.scrollNext()} className={`${arrow} right-0 translate-x-5`} aria-label="Next">
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
}

const PLACEHOLDER = 'https://placehold.co/320x320/f5f3ff/7c3aed?text=📱';

/* ── Carousel card ── */
function MiniProductCard({ product, badge, storesLabel }: {
  product: Pick<Product, 'id' | 'slug' | 'image' | 'name' | 'price'>;
  badge?: string;
  storesLabel?: string;
}) {
  return (
    <Link
      to={productPath(product)}
      className="shrink-0 w-[160px] md:w-[220px] group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-700/60 transition-all duration-200"
    >
      <div className="relative h-36 md:h-44 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        <img
          src={product.image || PLACEHOLDER} alt={product.name} loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
        />
        {badge && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            {badge}
          </span>
        )}
        {storesLabel && (
          <span className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-700 text-[10px] font-black text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-lg">
            {storesLabel}
          </span>
        )}
      </div>
      <div className="p-3 md:p-3.5 flex flex-col flex-1 gap-2">
        <p className="text-[13px] md:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug flex-1 min-h-[36px] md:min-h-[40px]">
          {product.name}
        </p>
        <p className="text-sm md:text-base font-black text-violet-600 dark:text-violet-400 leading-none">
          {formatSum(product.price)}
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-[160px] md:w-[220px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse overflow-hidden" aria-hidden="true">
      <div className="h-36 md:h-44 bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/5" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-2/5 mt-3" />
      </div>
    </div>
  );
}

function LoadError({ text, retry, onRetry }: { text: string; retry: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
      {text}
      <button type="button" onClick={onRetry}
        className="inline-flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 hover:underline">
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {retry}
      </button>
    </div>
  );
}

/* ── Hero: haqiqiy mahsulotning haqiqiy narxlari ── */
function ShowcaseCard({ product, labels, compact = false }: {
  product: Product;
  labels: { label: string; cheapest: string; gap: string; cta: string };
  compact?: boolean;
}) {
  const offers = [...(product.markets ?? [])].sort((a, b) => a.price - b.price).slice(0, compact ? 3 : 4);
  if (offers.length < 2) return null;
  const all = (product.markets ?? []).map(m => m.price);
  const gap = Math.max(...all) - Math.min(...all);
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-5 w-full md:w-[340px] text-left">
      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
        </span>
        {labels.label}
      </p>
      <Link to={productPath(product)} className="flex items-center gap-3 mb-3 group">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src={product.image || PLACEHOLDER} alt="" className="w-full h-full object-contain p-1.5"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
        </div>
        <p className="text-white text-sm font-bold leading-snug line-clamp-2 group-hover:underline">{product.name}</p>
      </Link>
      <ul className="space-y-1.5">
        {offers.map((o, i) => (
          <li key={o.source} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${i === 0 ? 'bg-emerald-400/20 border border-emerald-300/30' : 'bg-white/5'}`}>
            <span className="text-sm font-semibold text-white/90 truncate flex items-center gap-1.5">
              {i === 0 && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />}
              {o.source}
              {i === 0 && <span className="sr-only"> — {labels.cheapest}</span>}
            </span>
            <span className={`text-sm font-black shrink-0 ${i === 0 ? 'text-emerald-200' : 'text-white/70'}`}>{formatSum(o.price)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
        <span className="text-xs font-bold text-emerald-200">{labels.gap.replace('{{amount}}', formatSum(gap))}</span>
        <Link to={productPath(product)} className="text-xs font-black text-white hover:underline flex items-center gap-1">
          {labels.cta} <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 open:shadow-sm">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-sm md:text-base text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
    </details>
  );
}

export function Landing() {
  const { t, language } = useLanguage();
  const h = t.home;
  const navigate = useNavigate();
  const { products: allProducts } = useProducts(1, 20);
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const brands = useBrands();
  const { markets, status: marketsStatus, retry: retryMarkets } = useMarkets();
  const clientRecs = useRecommendations(allProducts, 8);
  const showClientRecs = clientRecs.length > 0 && (favorites.length > 0 || !!user?.profile.preferredBrands.length);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [deals, setDeals] = useState<Product[]>([]);
  const [dealsStatus, setDealsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [personalizedRecs, setPersonalizedRecs] = useState<Product[]>([]);
  const [personalizedType, setPersonalizedType] = useState('');
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) { searchRef.current?.focus(); return; }
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

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

  const dealGap = (p: Product) => {
    const prices = (p.markets ?? []).map(x => x.price);
    return prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;
  };
  const showcase = deals.find(p => (p.markets?.length ?? 0) >= 3) ?? deals[0];
  const topBrands = brands.slice(0, 6);
  const storeList = markets.map(x => x.name).join(', ');

  const statTiles = [
    { icon: Smartphone, label: h.statProducts, value: stats ? fmt(stats.products) : null },
    { icon: Store,      label: h.statStores,   value: stats ? fmt(stats.markets) : null },
    { icon: Layers,     label: h.statComparable, value: stats ? fmt(stats.comparableProducts) : null },
    { icon: Clock,      label: h.statUpdated,  value: stats ? (updated ?? '—') : null },
  ];

  return (
    <LazyMotion features={loadMotionFeatures}>
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-0 transition-colors">
      <SEO
        title={t.landing.seoTitle}
        description={t.landing.seoDesc}
        keywords={['smartfonlar', 'telefon narxi', 'narx solishtirish', 'bazarcom', ...markets.slice(0, 6).map(x => x.name.toLowerCase())].join(', ')}
        locale={language}
        canonicalUrl={`${SITE_URL}/`}
      />

      {/* ══ HERO ══ */}
      <section aria-labelledby="hero-title" className="md:px-4 md:pt-6 md:max-w-7xl md:mx-auto">
        <div className="relative md:rounded-[2rem] overflow-hidden bg-linear-to-br from-violet-600 via-violet-700 to-indigo-900 shadow-2xl shadow-violet-500/25">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-fuchsia-400/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_45%)]" />
          </div>

          <div className="relative z-10 px-5 pt-7 pb-6 md:px-12 md:py-14 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div className="flex-1 min-w-0">
              <p className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4 text-white/90 text-[11px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-yellow-300" aria-hidden="true" />
                {stats ? fill(h.eyebrow) : <span className="inline-block w-40 h-3 rounded-full bg-white/20 animate-pulse" />}
              </p>
              <h1 id="hero-title" className="text-white font-black leading-[1.08] tracking-tight mb-3" style={{ fontSize: 'clamp(1.9rem, 6vw, 3.4rem)' }}>
                {h.title}
              </h1>
              <p className="text-white/75 text-sm md:text-lg leading-relaxed mb-6 max-w-xl">
                {stats ? fill(h.subtitle) : <span className="inline-block w-64 h-4 rounded-full bg-white/15 animate-pulse" />}
              </p>

              <form role="search" onSubmit={onSearch} className="flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-xl shadow-black/20 max-w-xl">
                <label htmlFor="hero-search" className="sr-only">{h.searchButton}</label>
                <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" aria-hidden="true" />
                <input
                  ref={searchRef} id="hero-search" type="search" value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={h.searchPlaceholder} enterKeyHint="search" autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent px-1 py-2.5 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                <button type="submit" className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl px-4 md:px-6 py-2.5 transition-colors">
                  {h.searchButton}
                </button>
              </form>

              {topBrands.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-white/60 text-xs font-semibold">{h.popular}</span>
                  {topBrands.map(b => (
                    <Link key={b.key} to={`/products?brand=${encodeURIComponent(b.key)}`}
                      className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1 transition-colors">
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="md:shrink-0">
              {showcase ? (
                <ShowcaseCard product={showcase}
                  labels={{ label: h.showcaseLabel, cheapest: h.showcaseCheapest, gap: h.showcaseGap, cta: h.showcaseCta }} />
              ) : dealsStatus === 'loading' ? (
                <div className="w-full md:w-[340px] h-64 rounded-3xl bg-white/10 animate-pulse" aria-hidden="true" />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section aria-label={h.statProducts} className="px-4 max-w-7xl mx-auto -mt-px md:mt-5">
        {statsFailed ? (
          <div className="mt-4"><LoadError text={h.loadError} retry={h.retry} onRetry={() => setAttempt(a => a + 1)} /></div>
        ) : (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 mt-4 md:mt-0">
            {statTiles.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dd className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
                    {value ?? <span className="inline-block w-14 h-5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse align-middle" />}
                  </dd>
                  <dt className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{label}</dt>
                </div>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* ══ BIGGEST GAPS ══ */}
      <m.section {...reveal} aria-labelledby="deals-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
        <SectionHeader id="deals-title" title={h.savingsTitle} subtitle={h.savingsSubtitle}
          icon={TrendingDown} linkTo="/products" linkLabel={t.landing.trending.viewAll} />
        {dealsStatus === 'error' ? (
          <LoadError text={h.loadError} retry={h.retry} onRetry={() => setAttempt(a => a + 1)} />
        ) : (
          <Carousel>
            {dealsStatus === 'loading'
              ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
              : deals.map(p => (
                  <MiniProductCard key={p.id} product={p}
                    badge={dealGap(p) > 0 ? h.savingsBadge.replace('{{amount}}', formatSum(dealGap(p))) : undefined}
                    storesLabel={h.storesTag.replace('{{count}}', String(p.markets?.length ?? 0))} />
                ))}
          </Carousel>
        )}
      </m.section>

      {/* ══ PERSONAL ══ */}
      {showClientRecs && (
        <m.section {...reveal} aria-labelledby="foryou-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
          <SectionHeader id="foryou-title" title={t.landing.forYouTitle}
            subtitle={favorites.length > 0 ? t.landing.forYouFromFavorites : t.landing.forYouFromProfile}
            icon={Sparkles} linkTo="/products" linkLabel={t.landing.trending.viewAll} />
          <Carousel>
            {clientRecs.map(p => (
              <MiniProductCard key={p.id} product={p}
                storesLabel={(p.markets?.length ?? 0) > 1 ? h.storesTag.replace('{{count}}', String(p.markets?.length)) : undefined} />
            ))}
          </Carousel>
        </m.section>
      )}
      {!showClientRecs && personalizedType === 'personalized' && personalizedRecs.length > 0 && (
        <m.section {...reveal} aria-labelledby="special-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
          <SectionHeader id="special-title" title={t.landing.specialTitle} subtitle={t.landing.specialSubtitle}
            icon={Sparkles} linkTo="/products" linkLabel={t.landing.trending.viewAll} />
          <Carousel>
            {personalizedRecs.map(p => <MiniProductCard key={p.id} product={p} />)}
          </Carousel>
        </m.section>
      )}

      {/* ══ STORES ══ */}
      <m.section {...reveal} aria-labelledby="stores-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
        <SectionHeader id="stores-title" title={h.storesTitle} subtitle={h.storesSubtitle} icon={Store} />
        {marketsStatus === 'error' ? (
          <LoadError text={h.loadError} retry={h.retry} onRetry={retryMarkets} />
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {marketsStatus === 'loading'
              ? Array.from({ length: 12 }, (_, i) => <li key={i} className="h-[62px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)
              : markets.map(mk => (
                  <li key={mk.key}>
                    <Link to={`/products?market=${encodeURIComponent(mk.key)}`}
                      className="flex items-center gap-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mk.color }} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-gray-900 dark:text-white truncate">{mk.name}</span>
                        <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          {h.storeOffers.replace('{{count}}', fmt(mk.count))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
          </ul>
        )}
      </m.section>

      {/* ══ BRANDS ══ */}
      {brands.length > 0 && (
        <m.section {...reveal} aria-labelledby="brands-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
          <SectionHeader id="brands-title" title={h.brandsTitle} subtitle={h.brandsSubtitle} icon={Smartphone}
            linkTo="/products" linkLabel={t.landing.trending.viewAll} />
          <ul className="flex flex-wrap gap-2">
            {brands.map(b => (
              <li key={b.key}>
                <Link to={`/products?brand=${encodeURIComponent(b.key)}`}
                  className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-bold text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.key] ?? '#9ca3af' }} aria-hidden="true" />
                  {b.name}
                  {b.count > 0 && <span className="text-xs font-semibold text-gray-400">{fmt(b.count)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </m.section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      <m.section {...reveal} aria-labelledby="steps-title" className="mt-12 md:mt-20 bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-800/60 py-10 md:py-16">
        <div className="px-4 max-w-7xl mx-auto">
          <h2 id="steps-title" className="font-black text-gray-900 dark:text-white text-xl md:text-3xl mb-6 md:mb-10 text-center tracking-tight">
            {h.stepsTitle}
          </h2>
          <ol className="grid md:grid-cols-3 gap-3 md:gap-6">
            {h.steps.map((step, idx) => (
              <li key={step.title} className="relative flex md:flex-col items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-5 md:p-7 border border-gray-100 dark:border-gray-700 shadow-sm">
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-violet-500/30">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base mb-1">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </m.section>

      {/* ══ FAQ ══ */}
      <m.section {...reveal} aria-labelledby="faq-title" className="mt-12 md:mt-16 px-4 max-w-3xl mx-auto">
        <h2 id="faq-title" className="font-black text-gray-900 dark:text-white text-xl md:text-3xl mb-6 text-center tracking-tight">
          {h.faqTitle}
        </h2>
        <div className="space-y-2.5">
          {h.faq.map(item => (
            <FaqItem key={item.q} q={item.q}
              a={item.a
                .replace('{{updated}}', updated ?? '—')
                .replace('{{stores}}', stats ? String(stats.markets) : String(markets.length || '—'))
                .replace('{{list}}', storeList || '—')} />
          ))}
        </div>
      </m.section>

      {/* ══ CTA ══ */}
      <m.section {...reveal} className="px-4 py-10 md:py-16 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-indigo-900 p-7 md:p-14 shadow-xl shadow-violet-500/20">
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-white/[0.06] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-white font-black text-2xl md:text-4xl tracking-tight mb-2">{h.ctaTitle}</h2>
              {typeof stats?.comparableProducts === 'number' && <p className="text-white/75 text-sm md:text-base max-w-xl">{fill(h.ctaSubtitle)}</p>}
            </div>
            <Link to="/products"
              className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 font-black rounded-2xl px-8 py-4 text-sm md:text-base shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all shrink-0">
              {h.ctaButton}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </m.section>
    </div>
    </LazyMotion>
  );
}
