import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, X, ChevronRight,
  Search, Loader2, SlidersHorizontal, RotateCcw, ArrowLeft,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useSearchParams, useNavigate, Link, useLocation, useNavigationType } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';

const BRANDS = [
  'Apple', 'Samsung', 'Redmi', 'Xiaomi', 'Poco',
  'Honor', 'Vivo', 'Oppo', 'Realme', 'Tecno', 'Infinix',
];

const BRAND_COLORS: Record<string, string> = {
  Apple:   '#555',
  Samsung: '#1428A0',
  Redmi:   '#FF6900',
  Xiaomi:  '#F97316',
  Poco:    '#FFCD00',
  Honor:   '#CF0A2C',
  Vivo:    '#415FFF',
  Oppo:    '#1D8348',
  Realme:  '#E8B800',
  Tecno:   '#00AEEF',
  Infinix: '#E63946',
};

const MARKETPLACES = [
  { name: 'Asaxiy',     key: 'asaxiy',     color: '#7C3AED' },
  { name: 'Texnomart',  key: 'texnomart',  color: '#E31E24' },
  { name: 'Olcha',      key: 'olcha',      color: '#F97316' },
  { name: 'Mediapark',  key: 'mediapark',  color: '#10B981' },
  { name: 'Chakana',    key: 'chakana',    color: '#0EA5E9' },
  { name: 'Glotr',      key: 'glotr',      color: '#8B5CF6' },
  { name: 'Olx',        key: 'olx',        color: '#22C55E' },
  { name: 'Openshop',   key: 'openshop',   color: '#6366F1' },
  { name: 'Idea',       key: 'idea',       color: '#F59E0B' },
  { name: 'Brandstore', key: 'brandstore', color: '#4F46E5' },
  { name: 'Beemarket',    key: 'beemarket',    color: '#EC4899' },
  { name: 'Castore',      key: 'castore',      color: '#14B8A6' },
  { name: 'Joybox',       key: 'joybox',       color: '#F43F5E' },
  { name: 'Alif',         key: 'alif',         color: '#0891B2' },
  { name: 'Discont',      key: 'discont',      color: '#EF4444' },
  { name: 'Macbro',       key: 'macbro',       color: '#1D4ED8' },
  { name: 'Radius',       key: 'radius',       color: '#84CC16' },
  { name: 'Mi',           key: 'mi',           color: '#FF6900' },
  { name: 'Ucell',        key: 'ucell',        color: '#65A30D' },
  { name: 'Prom',         key: 'prom',         color: '#B45309' },
  { name: 'Wildberries',  key: 'wildberries',  color: '#CB11AB' },
];

const MARKETS_VISIBLE = 8;

const SORT_OPTIONS = [
  { key: 'relevance' as const, labelKey: 'relevance' },
  { key: 'priceLow'  as const, labelKey: 'priceAsc'  },
  { key: 'priceHigh' as const, labelKey: 'priceDesc' },
  { key: 'rating'    as const, labelKey: 'rating'    },
];
type SortKey = 'relevance' | 'priceLow' | 'priceHigh' | 'rating';

const FILTER_KEY = 'productListingFilters';
function getSavedFilters() {
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY) || 'null'); } catch { return null; }
}

function Cb({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex w-[15px] h-[15px] shrink-0 rounded-sm border transition-colors ${
      on ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
    }`}>
      {on && (
        <svg viewBox="0 0 10 10" className="m-auto w-2 h-2 text-white" fill="none">
          <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function formatPriceInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
      {children}
    </p>
  );
}

export function ProductListing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const searchQuery   = useMemo(() => new URLSearchParams(location.search).get('search') || '', [location.search]);
  const categoryParam = useMemo(() => new URLSearchParams(location.search).get('category') || 'All', [location.search]);

  const saved = useRef(getSavedFilters());

  const [selectedCategory,     setSelectedCategory]     = useState(categoryParam);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(saved.current?.selectedMarketplaces ?? []);
  const [minRating,     setMinRating]     = useState<number>(saved.current?.minRating ?? 0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(saved.current?.selectedBrand ?? null);
  const [minPrice,  setMinPrice]  = useState<string>(saved.current?.minPrice ?? '');
  const [maxPrice,  setMaxPrice]  = useState<string>(saved.current?.maxPrice ?? '');
  const [sortBy,    setSortBy]    = useState<SortKey>(saved.current?.sortBy ?? 'relevance');
  const [viewMode,  setViewMode]  = useState<'grid' | 'list'>(saved.current?.viewMode ?? 'grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [marketCounts,   setMarketCounts]   = useState<Record<string, number>>({});
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  const navType = useNavigationType();
  const isFirstRender = useRef(true);
  const [scrollRestored, setScrollRestored] = useState(false);

  // ── Draft states for filters ──
  const [draftCategory,     setDraftCategory]     = useState(selectedCategory);
  const [draftMarketplaces, setDraftMarketplaces] = useState<string[]>(selectedMarketplaces);
  const [draftRating,       setDraftRating]       = useState<number>(minRating);
  const [draftBrand,        setDraftBrand]        = useState<string | null>(selectedBrand);
  const [draftMinPrice,     setDraftMinPrice]     = useState<string>(minPrice);
  const [draftMaxPrice,     setDraftMaxPrice]     = useState<string>(maxPrice);

  useEffect(() => {
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    if (isMobileFilterOpen) {
      setDraftCategory(selectedCategory);
      setDraftMarketplaces(selectedMarketplaces);
      setDraftRating(minRating);
      setDraftBrand(selectedBrand);
      setDraftMinPrice(minPrice);
      setDraftMaxPrice(maxPrice);
    }
  }, [isMobileFilterOpen, selectedCategory, selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice]);

  // ── infinite scroll ──
  const sentinelRef       = useRef<HTMLDivElement>(null);
  const hasMoreRef        = useRef(false);
  const fetchingRef       = useRef(false);
  const loadMoreRef       = useRef<() => void>(() => {});
  const isIntersectingRef = useRef(false);

  const { products: rawProducts, isLoading, isFetchingNextPage, hasMore, loadMore, total } =
    useProducts(1, 20, searchQuery, selectedMarketplaces, selectedBrand ?? '', selectedCategory === 'All' ? '' : selectedCategory);

  hasMoreRef.current  = hasMore;
  fetchingRef.current = isFetchingNextPage;
  loadMoreRef.current = loadMore;

  const filteredProducts = useMemo(() => {
    let r = [...rawProducts];
    if (selectedMarketplaces.length > 0) {
      const set = new Set(selectedMarketplaces.map(m => m.toLowerCase()));
      r = r.filter(p => p.markets?.some(m => set.has(m.source.toLowerCase())));
    }
    if (minRating > 0) r = r.filter(p => p.rating >= minRating);
    const mn = parseFloat(minPrice.replace(/\s/g, ''));
    const mx = parseFloat(maxPrice.replace(/\s/g, ''));
    if (!isNaN(mn) && mn > 0) r = r.filter(p => p.price >= mn);
    if (!isNaN(mx) && mx > 0) r = r.filter(p => p.price <= mx);
    if (sortBy === 'priceLow')  r.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceHigh') r.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')    r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [rawProducts, selectedCategory, selectedMarketplaces, minRating, minPrice, maxPrice, sortBy]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedCategory !== 'All') n++;
    if (minRating > 0) n++;
    if (selectedBrand) n++;
    n += selectedMarketplaces.length;
    if (minPrice || maxPrice) n++;
    return n;
  }, [selectedCategory, minRating, selectedBrand, selectedMarketplaces, minPrice, maxPrice]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        isIntersectingRef.current = e.isIntersecting;
        if (e.isIntersecting && hasMoreRef.current && !fetchingRef.current) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (hasMoreRef.current && !fetchingRef.current && isIntersectingRef.current) {
      loadMoreRef.current();
    }
  });

  useEffect(() => {
    fetch('/api/markets').then(r => r.json())
      .then((d: { markets: { key: string; count: number }[] }) => {
        const c: Record<string, number> = {};
        for (const m of d.markets) c[m.key] = m.count;
        setMarketCounts(c);
      }).catch(() => {});
  }, []);

  const categories = ['All', 'Phones'];
  const categoryLabel: Record<string, string> = {
    All: t.listing.all,
    Phones: t.detail.categories.phones,
  };

  useEffect(() => { setSelectedCategory(categoryParam); }, [categoryParam]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    sessionStorage.removeItem('productListingScrollY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem('productListingScrollY', String(window.scrollY));
    };
  }, []);

  useEffect(() => {
    if (navType !== 'POP') {
      setScrollRestored(true);
      return;
    }

    if (!isLoading && filteredProducts.length > 0 && !scrollRestored) {
      const savedScroll = sessionStorage.getItem('productListingScrollY');
      if (savedScroll) {
        const y = parseFloat(savedScroll);
        if (y > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({ top: y, behavior: 'auto' });
          }, 80);
          setScrollRestored(true);
          return () => clearTimeout(timer);
        }
      }
      setScrollRestored(true);
    }
  }, [isLoading, filteredProducts.length, scrollRestored, navType]);

  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({
      selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode,
    }));
  }, [selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode]);

  const updateUrlCategory = useCallback((v: string) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p);
      v && v !== 'All' ? n.set('category', v) : n.delete('category');
      return n;
    }, { replace: true });
  }, [setSearchParams]);



  const handleResetFilters = () => {
    setSelectedCategory('All'); setSelectedMarketplaces([]); setMinRating(0);
    setSelectedBrand(null); setMinPrice(''); setMaxPrice(''); setSortBy('relevance');
    updateUrlCategory('All');
    // Reset drafts too
    setDraftCategory('All'); setDraftMarketplaces([]); setDraftRating(0);
    setDraftBrand(null); setDraftMinPrice(''); setDraftMaxPrice('');
  };

  const handleApplyMobileFilters = () => {
    setSelectedCategory(draftCategory);
    updateUrlCategory(draftCategory);
    setSelectedMarketplaces(draftMarketplaces);
    setMinRating(draftRating);
    setSelectedBrand(draftBrand);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setIsMobileFilterOpen(false);
  };

  const toggleMarketplace = useCallback((key: string) => {
    setSelectedMarketplaces(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const visibleMarkets = showAllMarkets ? MARKETPLACES : MARKETPLACES.slice(0, MARKETS_VISIBLE);

  // ── filter panel ──
  const FilterPanel = (isMobile: boolean) => {
    // Category mapping
    const cat = isMobile ? draftCategory : selectedCategory;
    const setCat = (v: string) => {
      if (isMobile) {
        setDraftCategory(v);
      } else {
        setSelectedCategory(v);
        updateUrlCategory(v);
      }
    };

    // Marketplace mapping
    const mps = isMobile ? draftMarketplaces : selectedMarketplaces;
    const toggleMp = (key: string) => {
      const setter = isMobile ? setDraftMarketplaces : setSelectedMarketplaces;
      setter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };
    const resetMps = () => {
      const setter = isMobile ? setDraftMarketplaces : setSelectedMarketplaces;
      setter([]);
    };

    // Rating mapping
    const rating = isMobile ? draftRating : minRating;
    const setRt = (v: number) => {
      const setter = isMobile ? setDraftRating : setMinRating;
      setter(v);
    };

    // Brand mapping
    const brand = isMobile ? draftBrand : selectedBrand;
    const setBr = (v: string | null) => {
      const setter = isMobile ? setDraftBrand : setSelectedBrand;
      setter(v);
    };

    // Price mapping (both use draft states so typing doesn't refresh layout)
    const minPr = draftMinPrice;
    const maxPr = draftMaxPrice;

    const handleApplyPriceDesktop = () => {
      setMinPrice(draftMinPrice);
      setMaxPrice(draftMaxPrice);
    };

    const hasPendingPriceChanges = !isMobile && (draftMinPrice !== minPrice || draftMaxPrice !== maxPrice);

    return (
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Kategoriya */}
        <div className="py-3">
          <SLabel>{t.listing.categories}</SLabel>
          <div className="space-y-0.5">
            {categories.map(c => {
              const active = cat === c;
              return (
                <button
                  key={c} type="button"
                  onClick={() => setCat(c)}
                  className={`flex w-full items-center gap-2.5 rounded px-1.5 py-[7px] text-left text-[13px] transition-colors ${
                    active
                    ? 'text-violet-600 dark:text-violet-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    active ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />}
                  </span>
                  {categoryLabel[c] ?? c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Narx */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <SLabel>{t.listing.priceRange}</SLabel>
            {(minPr || maxPr) && (
              <button onClick={() => {
                setDraftMinPrice('');
                setDraftMaxPrice('');
                if (!isMobile) {
                  setMinPrice('');
                  setMaxPrice('');
                }
              }}
                className="text-[10px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input type="text" inputMode="numeric" placeholder={t.listing.priceFrom} value={minPr}
              onChange={e => setDraftMinPrice(formatPriceInput(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
              className="w-full min-w-0 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/40 transition"
            />
            <span className="text-gray-400 text-sm shrink-0">—</span>
            <input type="text" inputMode="numeric" placeholder={t.listing.priceTo} value={maxPr}
              onChange={e => setDraftMaxPrice(formatPriceInput(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
              className="w-full min-w-0 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/40 transition"
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{t.listing.currency}</p>
          
          {hasPendingPriceChanges && (
            <button
              type="button"
              onClick={handleApplyPriceDesktop}
              className="mt-2.5 w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-[11px] font-black py-2 rounded-xl shadow-md shadow-violet-500/10 transition-all"
            >
              {t.listing.viewResults}
            </button>
          )}
        </div>

        {/* Reyting */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <SLabel>{t.listing.rating}</SLabel>
            {rating > 0 && (
              <button onClick={() => setRt(0)} className="text-[10px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
            )}
          </div>
          <div className="space-y-0.5">
            {([0, 4.5, 4, 3] as const).map(r => (
              <button key={r} type="button" onClick={() => setRt(r)}
                className={`flex w-full items-center gap-2.5 rounded px-1.5 py-[7px] text-left text-[13px] transition-colors ${
                  rating === r ? 'text-violet-600 dark:text-violet-400 font-semibold'
                                  : 'text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  rating === r ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {rating === r && <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />}
                </span>
                {r === 0 ? <span>{t.listing.allRating}</span> : (
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.floor(r))}{r % 1 ? '½' : ''}</span>
                    <span>{r}+</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Brendlar */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <SLabel>{t.listing.brands}</SLabel>
            {brand && (
              <button onClick={() => setBr(null)} className="text-[10px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
            )}
          </div>
          <div className="space-y-0.5">
            {BRANDS.map(b => {
              const on = brand === b;
              return (
                <button key={b} type="button" onClick={() => setBr(on ? null : b)}
                  className="flex w-full items-center gap-2 rounded px-1.5 py-[7px] text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
                >
                  <Cb on={on} />
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[b] ?? '#9ca3af' }} />
                  <span className={`flex-1 text-[13px] transition-colors ${
                    on ? 'text-violet-600 dark:text-violet-400 font-semibold'
                       : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                  }`}>
                    {b}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Do'konlar */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <SLabel>{t.listing.stores}</SLabel>
            {mps.length > 0 && (
              <button onClick={resetMps} className="text-[10px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
            )}
          </div>
          <div className="space-y-0.5">
            {visibleMarkets.map(({ name, key, color }) => {
              const on  = mps.includes(key);
              const cnt = marketCounts[key];
              return (
                <button key={key} type="button" onClick={() => toggleMp(key)}
                  className="flex w-full items-center gap-2 rounded px-1.5 py-[7px] text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
                >
                  <Cb on={on} />
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className={`flex-1 text-[13px] transition-colors ${
                    on ? 'text-violet-600 dark:text-violet-400 font-semibold'
                       : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                  }`}>
                    {name}
                  </span>
                  {cnt !== undefined && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">({cnt})</span>
                  )}
                </button>
              );
            })}
          </div>
          {MARKETPLACES.length > MARKETS_VISIBLE && (
            <button type="button" onClick={() => setShowAllMarkets(v => !v)}
              className="mt-1.5 ml-1.5 text-[12px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {showAllMarkets ? t.listing.showLess : t.listing.showAll.replace('{{count}}', MARKETPLACES.length.toString())}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-950">

      {/* ── Mobile sticky header ── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200/70 dark:border-gray-800/70 md:hidden">
        {/* Top row */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span className="flex-1 text-sm font-bold text-gray-900 dark:text-white truncate">
            {searchQuery ? `"${searchQuery}"` : t.listing.title}
          </span>

          {/* Filter button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="relative flex items-center gap-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0 active:scale-95 transition-all"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t.listing.filters}
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white shadow-sm shadow-violet-500/30">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-xl px-2 py-1.5 transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl px-2 py-1.5 transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Sort chips */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SORT_OPTIONS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                sortBy === key
                  ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
              }`}
            >
              {(t.listing as any)[labelKey] ?? labelKey}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 pb-24 md:pb-8">

        {/* Breadcrumb — desktop */}
        <nav className="mb-4 hidden items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500 md:flex">
          <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {searchQuery ? t.listing.resultsFor.replace('{{query}}', searchQuery) : t.listing.products}
          </span>
        </nav>

        <div className="flex gap-6">

          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden w-[220px] shrink-0 lg:block">
            <div
              className="sticky top-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto overflow-x-hidden"
              style={{ maxHeight: 'calc(100vh - 3rem)' }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                  {t.listing.filters}
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-violet-600 px-1.5 text-[10px] font-black text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> {t.listing.reset}
                  </button>
                )}
              </div>
              <div className="px-3 pb-4">
                {FilterPanel(false)}
              </div>
            </div>
          </aside>

          {/* ── Products ── */}
          <div className="flex-1 min-w-0">

            {/* Desktop toolbar */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                {isLoading ? '...' : (
                  <span>{t.listing.totalProductsCount.replace('{{count}}', total.toLocaleString())}</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
                  {SORT_OPTIONS.map(({ key, labelKey }) => (
                    <button key={key} onClick={() => setSortBy(key)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                        sortBy === key ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {(t.listing as any)[labelKey] ?? labelKey}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
                  <button onClick={() => setViewMode('grid')}
                    className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedBrand && (
                  <span className="flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[selectedBrand] ?? '#555' }} />
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand(null)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    {'★'.repeat(Math.floor(minRating))} {minRating}+
                    <button onClick={() => setMinRating(0)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="flex items-center gap-1 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:text-green-400">
                    {minPrice ? formatSum(Number(minPrice.replace(/\s/g, ''))) : '0'} — {maxPrice ? formatSum(Number(maxPrice.replace(/\s/g, ''))) : '∞'}
                    <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedMarketplaces.map(mk => {
                  const mp = MARKETPLACES.find(m => m.key === mk);
                  return (
                    <span key={mk} className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      {mp && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mp.color }} />}
                      {mp?.name ?? mk}
                      <button onClick={() => toggleMarketplace(mk)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                    </span>
                  );
                })}
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-red-500 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> {t.listing.allRating}
                </button>
              </div>
            )}

            {/* Products grid/list */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
                </div>
                <p className="text-sm text-gray-400">{t.common.loading}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">{t.listing.noProductsFound}</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">{t.listing.noProductsDesc}</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t.listing.resetFilters}
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 md:gap-4">
                    {filteredProducts.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: Math.min(i, 15) * 0.045 }}
                      >
                        <ProductCard product={p} activeMarkets={selectedMarketplaces} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredProducts.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.28, delay: Math.min(i, 15) * 0.04 }}
                      >
                        <ProductCard product={p} viewMode="list" activeMarkets={selectedMarketplaces} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Infinite scroll sentinel — always mounted so observer fires on first load */}
            <div ref={sentinelRef} className="mt-8 flex items-center justify-center h-10">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  <span>{t.common.loading}</span>
                </div>
              )}
              {!hasMore && filteredProducts.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  {t.listing.shownProducts.replace('{{count}}', total.toLocaleString())}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile filter bottom sheet ── */}
      <AnimatePresence>
      {isMobileFilterOpen && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 max-h-[92vh] bg-white dark:bg-gray-950 flex flex-col"
            style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">{t.listing.filters}</span>
                {activeFilterCount > 0 && (
                  <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

             {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-2 pb-32">
              {FilterPanel(true)}
            </div>

            {/* Footer actions */}
            <div
              className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-4"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> {t.listing.reset}
              </button>
              <button
                onClick={handleApplyMobileFilters}
                className="rounded-2xl bg-violet-600 hover:bg-violet-700 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all"
              >
                {t.listing.viewResults}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
