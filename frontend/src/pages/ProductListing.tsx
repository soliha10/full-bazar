import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, X, ChevronRight,
  Search, Loader2, SlidersHorizontal, RotateCcw, ArrowLeft,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { fetchSpecFacets } from '../services/api';
import { useSearchParams, useNavigate, Link, useLocation, useNavigationType } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';
import { SEO, SITE_URL } from '../components/SEO';


/**
 * Brend ro'yxati endi bazadan (/api/brands) keladi — qattiq yozilmagan.
 *
 * Ilgari bu ro'yxat qo'lda yozilardi va bazada mahsuloti yo'q brend ham
 * ko'rinardi: foydalanuvchi uni bosib bo'sh sahifaga tushardi. Endi brend
 * faqat haqiqatda mahsuloti bo'lsa ko'rinadi va yonida soni turadi.
 */
interface BrandFacet { key: string; name: string; count: number }

const BRAND_COLORS: Record<string, string> = {
  apple:    '#555',
  samsung:  '#1428A0',
  redmi:    '#FF6900',
  xiaomi:   '#F97316',
  poco:     '#FFCD00',
  honor:    '#CF0A2C',
  huawei:   '#C8102E',
  vivo:     '#415FFF',
  oppo:     '#1D8348',
  realme:   '#E8B800',
  tecno:    '#00AEEF',
  infinix:  '#E63946',
  itel:     '#0EA5E9',
  zte:      '#0057B8',
  nokia:    '#124191',
  motorola: '#5C92FA',
  google:   '#34A853',
};

const MARKETPLACES = [
  { name: 'Asaxiy',     key: 'asaxiy',     color: '#7C3AED' },
  { name: 'Texnomart',  key: 'texnomart',  color: '#E31E24' },
  { name: 'Olcha',      key: 'olcha',      color: '#F97316' },
  { name: 'Mediapark',  key: 'mediapark',  color: '#10B981' },
  { name: 'Chakana',    key: 'chakana',    color: '#0EA5E9' },
  { name: 'Glotr',      key: 'glotr',      color: '#8B5CF6' },
  { name: 'Openshop',   key: 'openshop',   color: '#6366F1' },
  { name: 'Idea',       key: 'idea',       color: '#F59E0B' },
  { name: 'Beemarket',    key: 'beemarket',    color: '#EC4899' },
  { name: 'Castore',      key: 'castore',      color: '#14B8A6' },
  { name: 'Joybox',       key: 'joybox',       color: '#F43F5E' },
  { name: 'Alif',         key: 'alif',         color: '#0891B2' },
  { name: 'Discont',      key: 'discont',      color: '#EF4444' },
  { name: 'Macbro',       key: 'macbro',       color: '#1D4ED8' },
  { name: 'Radius',       key: 'radius',       color: '#84CC16' },
  { name: 'Mi',           key: 'mi',           color: '#FF6900' },
  { name: 'Ucell',        key: 'ucell',        color: '#65A30D' },
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
  const { t, language } = useLanguage();
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
  const [activeFilterTab, setActiveFilterTab] = useState<'category' | 'price' | 'brand' | 'store' | 'rating' | 'specs'>('category');
  // ── Xususiyat filtrlari (RAM / xotira / batareya) ──
  const [selectedRam,     setSelectedRam]     = useState<string[]>(saved.current?.selectedRam ?? []);
  const [selectedStorage, setSelectedStorage] = useState<string[]>(saved.current?.selectedStorage ?? []);
  const [minBattery,      setMinBattery]      = useState<number>(saved.current?.minBattery ?? 0);
  const [specFacets, setSpecFacets] = useState<{
    ram: { value: string; count: number }[];
    storage: { value: string; count: number }[];
    battery: { min: number; max: number } | null;
  }>({ ram: [], storage: [], battery: null });
  const [marketCounts,   setMarketCounts]   = useState<Record<string, number>>({});
  const [brandFacets,    setBrandFacets]    = useState<BrandFacet[]>([]);
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p);
      if (query.trim()) {
        n.set('search', query.trim());
      } else {
        n.delete('search');
      }
      return n;
    });
  }, [setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = new URLSearchParams(location.search).get('search') || '';
      if (localSearch.trim() !== currentSearch.trim()) {
        handleSearch(localSearch);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localSearch, location.search, handleSearch]);

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
  const [draftRam,          setDraftRam]          = useState<string[]>(selectedRam);
  const [draftStorage,      setDraftStorage]      = useState<string[]>(selectedStorage);
  const [draftBattery,      setDraftBattery]      = useState<number>(minBattery);

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
      setDraftRam(selectedRam);
      setDraftStorage(selectedStorage);
      setDraftBattery(minBattery);
    }
  }, [isMobileFilterOpen, selectedCategory, selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice,
      selectedRam, selectedStorage, minBattery]);

  // Filtr qiymatlari sinxronizatsiya orasida o'zgarmaydi — bir marta olinadi.
  useEffect(() => {
    fetchSpecFacets().then(setSpecFacets).catch(() => {});
  }, []);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  // ── infinite scroll ──
  const sentinelRef       = useRef<HTMLDivElement>(null);
  const hasMoreRef        = useRef(false);
  const fetchingRef       = useRef(false);
  const loadMoreRef       = useRef<() => void>(() => {});
  const isIntersectingRef = useRef(false);

  const { products: rawProducts, isLoading, isFetchingNextPage, hasMore, loadMore, total } =
    useProducts(1, 20, searchQuery, selectedMarketplaces, selectedBrand ?? '', selectedCategory === 'All' ? '' : selectedCategory,
      { ram: selectedRam, storage: selectedStorage, batteryMin: minBattery });

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
    n += selectedRam.length + selectedStorage.length;
    if (minBattery > 0) n++;
    return n;
  }, [selectedCategory, minRating, selectedBrand, selectedMarketplaces, minPrice, maxPrice,
      selectedRam, selectedStorage, minBattery]);

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

    fetch('/api/brands').then(r => r.json())
      .then((d: { brands: BrandFacet[] }) => setBrandFacets(d.brands ?? []))
      .catch(() => {});
  }, []);

  // Filtr kaliti kichik harfda ("poco"), ekranda esa chiroyli nomi kerak.
  const brandLabel = useCallback(
    (key: string) => brandFacets.find(b => b.key === key)?.name ?? key,
    [brandFacets],
  );

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
      selectedRam, selectedStorage, minBattery,
    }));
  }, [selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode,
      selectedRam, selectedStorage, minBattery]);

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
    setSelectedRam([]); setSelectedStorage([]); setMinBattery(0);
    setDraftRam([]); setDraftStorage([]); setDraftBattery(0);
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
    setSelectedRam(draftRam);
    setSelectedStorage(draftStorage);
    setMinBattery(draftBattery);
    setIsMobileFilterOpen(false);
  };

  const toggleMarketplace = useCallback((key: string) => {
    setSelectedMarketplaces(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const visibleMarkets = (showAllMarkets || isMobileFilterOpen) ? MARKETPLACES : MARKETPLACES.slice(0, MARKETS_VISIBLE);

  // ── filter panel ──
  const FilterPanel = (isMobile: boolean, mobileTab?: 'category' | 'price' | 'brand' | 'store' | 'rating' | 'specs') => {
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

    // Xususiyat filtrlari — mobil rejimda draft, desktopda darhol qo'llanadi
    const ramSel     = isMobile ? draftRam : selectedRam;
    const storageSel = isMobile ? draftStorage : selectedStorage;
    const batterySel = isMobile ? draftBattery : minBattery;
    const toggleSpec = (list: string[], value: string, set: (v: string[]) => void) =>
      set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    const setRam     = (v: string[]) => (isMobile ? setDraftRam : setSelectedRam)(v);
    const setStorage = (v: string[]) => (isMobile ? setDraftStorage : setSelectedStorage)(v);
    const setBattery = (v: number)   => (isMobile ? setDraftBattery : setMinBattery)(v);

    // Price mapping (both use draft states so typing doesn't refresh layout)
    const minPr = draftMinPrice;
    const maxPr = draftMaxPrice;

    const handleApplyPriceDesktop = () => {
      setMinPrice(draftMinPrice);
      setMaxPrice(draftMaxPrice);
    };


    return (
      <div className={isMobile ? "px-1" : "divide-y divide-gray-100 dark:divide-gray-800"}>
        {/* Kategoriya */}
        {(!isMobile || mobileTab === 'category') && (
          <div className={isMobile ? "py-1" : "py-3"}>
            <SLabel>{t.listing.categories}</SLabel>
            <div className="space-y-0.5">
              {categories.map(c => {
                const active = cat === c;
                return (
                  <button
                    key={c} type="button"
                    onClick={() => setCat(c)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-3 text-left text-[14px] transition-colors ${
                      active
                      ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/55 dark:hover:bg-gray-900/40'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      active ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {active && <span className="w-2 h-2 rounded-full bg-violet-600" />}
                    </span>
                    {categoryLabel[c] ?? c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Narx */}
        {(!isMobile || mobileTab === 'price') && (
          <div className={isMobile ? "py-1" : "py-3"}>
            <div className="flex items-center justify-between mb-2.5">
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
                  className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="text" inputMode="numeric" placeholder={t.listing.priceFrom} value={minPr}
                onChange={e => setDraftMinPrice(formatPriceInput(e.target.value))}
                onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
                className="w-full min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/40 transition"
              />
              <span className="text-gray-400 text-sm shrink-0">—</span>
              <input type="text" inputMode="numeric" placeholder={t.listing.priceTo} value={maxPr}
                onChange={e => setDraftMaxPrice(formatPriceInput(e.target.value))}
                onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
                className="w-full min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/40 transition"
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 font-semibold uppercase tracking-wider">{t.listing.currency}</p>
            
            {!isMobile && (
              <button
                type="button"
                onClick={handleApplyPriceDesktop}
                className="mt-2.5 w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-[11px] font-black py-2 rounded-xl shadow-md shadow-violet-500/10 transition-all"
              >
                {t.listing.viewResults}
              </button>
            )}
          </div>
        )}

        {/* Xususiyatlar — RAM, xotira, batareya.
            Xalqaro agregatorlarda bu asosiy filtrlardan biri: foydalanuvchi
            "8GB RAM va 256GB xotirali telefon" deb qidiradi, brend bo'yicha
            emas. Qiymatlar /api/spec-facets dan keladi, shuning uchun ro'yxatda
            faqat haqiqatan mavjud variantlar chiqadi. */}
        {(!isMobile || mobileTab === 'specs') && (specFacets.ram.length > 0 || specFacets.storage.length > 0) && (
          <div className={isMobile ? "py-1" : "py-3"}>
            <div className="flex items-center justify-between mb-2">
              <SLabel>Xususiyatlar</SLabel>
              {(ramSel.length > 0 || storageSel.length > 0 || batterySel > 0) && (
                <button
                  onClick={() => { setRam([]); setStorage([]); setBattery(0); }}
                  className="text-[11px] text-violet-500 hover:underline leading-none"
                >
                  {t.listing.clear}
                </button>
              )}
            </div>

            {specFacets.ram.length > 0 && (
              <>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">RAM</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {specFacets.ram.map(({ value }) => {
                    const on = ramSel.includes(value);
                    return (
                      <button key={value} type="button"
                        onClick={() => toggleSpec(ramSel, value, setRam)}
                        aria-pressed={on}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                          on ? 'bg-violet-600 border-violet-600 text-white'
                             : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                        }`}>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {specFacets.storage.length > 0 && (
              <>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">Xotira</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {specFacets.storage.map(({ value }) => {
                    const on = storageSel.includes(value);
                    return (
                      <button key={value} type="button"
                        onClick={() => toggleSpec(storageSel, value, setStorage)}
                        aria-pressed={on}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                          on ? 'bg-violet-600 border-violet-600 text-white'
                             : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                        }`}>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {specFacets.battery && (
              <>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">Batareya</p>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 4000, 5000, 6000].map(v => (
                    <button key={v} type="button"
                      onClick={() => setBattery(v)}
                      aria-pressed={batterySel === v}
                      className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                        batterySel === v ? 'bg-violet-600 border-violet-600 text-white'
                                         : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                      }`}>
                      {v === 0 ? 'Barchasi' : `${v}+ mAh`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Reyting */}
        {(!isMobile || mobileTab === 'rating') && (
          <div className={isMobile ? "py-1" : "py-3"}>
            <div className="flex items-center justify-between mb-2">
              <SLabel>{t.listing.rating}</SLabel>
              {rating > 0 && (
                <button onClick={() => setRt(0)} className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
              )}
            </div>
            <div className="space-y-0.5">
              {([0, 4.5, 4, 3] as const).map(r => (
                <button key={r} type="button" onClick={() => setRt(r)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-3 text-left text-[14px] transition-colors ${
                    rating === r ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-semibold'
                                 : 'text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/55 dark:hover:bg-gray-900/40'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    rating === r ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {rating === r && <span className="w-2 h-2 rounded-full bg-violet-600" />}
                  </span>
                  {r === 0 ? <span>{t.listing.allRating}</span> : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-xs">{'★'.repeat(Math.floor(r))}{r % 1 ? '½' : ''}</span>
                      <span>{r}+</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Brendlar */}
        {(!isMobile || mobileTab === 'brand') && (
          <div className={isMobile ? "py-1" : "py-3"}>
            <div className="flex items-center justify-between mb-2">
              <SLabel>{t.listing.brands}</SLabel>
              {brand && (
                <button onClick={() => setBr(null)} className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
              )}
            </div>
            <div className="space-y-0.5">
              {brandFacets.map(({ key, name, count }) => {
                const on = brand === key;
                return (
                  <button key={key} type="button" onClick={() => setBr(on ? null : key)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left hover:bg-gray-100/60 dark:hover:bg-gray-900/60 transition-colors group"
                  >
                    <Cb on={on} />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[key] ?? '#9ca3af' }} />
                    <span className={`flex-1 text-[13px] transition-colors ${
                      on ? 'text-violet-600 dark:text-violet-400 font-semibold'
                         : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    }`}>
                      {name}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Do'konlar */}
        {(!isMobile || mobileTab === 'store') && (
          <div className={isMobile ? "py-1" : "py-3"}>
            <div className="flex items-center justify-between mb-2">
              <SLabel>{t.listing.stores}</SLabel>
              {mps.length > 0 && (
                <button onClick={resetMps} className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
              )}
            </div>
            <div className="space-y-0.5">
              {visibleMarkets.map(({ name, key, color }) => {
                const on  = mps.includes(key);
                const cnt = marketCounts[key];
                return (
                  <button key={key} type="button" onClick={() => toggleMp(key)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left hover:bg-gray-100/60 dark:hover:bg-gray-900/60 transition-colors group"
                  >
                    <Cb on={on} />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
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
            {!isMobile && MARKETPLACES.length > MARKETS_VISIBLE && (
              <button type="button" onClick={() => setShowAllMarkets(v => !v)}
                className="mt-1.5 ml-1.5 text-[12px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                {showAllMarkets ? t.listing.showLess : t.listing.showAll.replace('{{count}}', MARKETPLACES.length.toString())}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const seoTitle = useMemo(() => {
    let part = language === 'uz' ? 'Katalog' : 'Каталог';
    if (selectedBrand) {
      part = selectedBrand;
    } else if (selectedCategory && selectedCategory !== 'All') {
      part = selectedCategory === 'smartphones' 
        ? (language === 'uz' ? 'Smartfonlar' : 'Смартфоны')
        : selectedCategory;
    }
    if (searchQuery) {
      part = `${searchQuery} ${language === 'uz' ? 'qidiruv natijalari' : 'результаты поиска'}`;
    }
    return `${part} - Smartfonlar narxlari solishtiruvi`;
  }, [selectedBrand, selectedCategory, searchQuery, language]);

  const seoDesc = useMemo(() => {
    return language === 'uz'
      ? `Bazarcom - O'zbekistondagi barcha do'konlardagi ${selectedBrand || 'smartfonlar'} narxlarini solishtirish, tahlil qilish va eng yaxshisini tanlash.`
      : `Bazarcom - Сравнение цен на ${selectedBrand || 'смартфоны'} во всех магазинах Узбекистана.`;
  }, [selectedBrand, language]);

  // Sahifadagi ko'rinadigan h1 — SEO sarlavhasidan qisqaroq va tabiiyroq
  const pageHeading = useMemo(() => {
    if (searchQuery) {
      return language === 'uz'
        ? `"${searchQuery}" bo'yicha natijalar`
        : `Результаты по запросу "${searchQuery}"`;
    }
    if (selectedBrand) {
      return language === 'uz'
        ? `${selectedBrand} smartfonlari narxlari`
        : `Цены на смартфоны ${selectedBrand}`;
    }
    return language === 'uz'
      ? "Smartfonlar narxlari — O'zbekiston do'konlari"
      : 'Цены на смартфоны — магазины Узбекистана';
  }, [searchQuery, selectedBrand, language]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-950">
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords={`smartfonlar, ${selectedBrand || ''}, telefonlar, telefon narxi, bazarcom, asaxiy, texnomart, olcha`}
        locale={language}
        // Qidiruv va filtr kombinatsiyalari cheksiz URL hosil qiladi — ularni
        // indeksdan chiqarib, kanonikni toza /products ga yo'naltiramiz.
        noindex={Boolean(searchQuery) || activeFilterCount > 0}
        canonicalUrl={`${SITE_URL}/products`}
        breadcrumbs={[
          { name: language === 'uz' ? 'Bosh sahifa' : 'Главная', url: '/' },
          { name: language === 'uz' ? 'Smartfonlar' : 'Смартфоны', url: '/products' },
        ]}
      />

      {/* ── Mobile sticky header ── */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/60 md:hidden">
        {/* Top row: Title/Search input + Back button + View mode */}
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          {/* Search Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(localSearch);
            }}
            className="flex-1 relative group min-w-0"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-violet-500 transition-colors pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              placeholder={t.nav.searchPlaceholder || "Qidirish..."}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 focus:bg-white dark:focus:bg-gray-800 transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  handleSearch('');
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
          
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-xl border border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-2 py-1 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-2 py-1 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Second row: Filter trigger & Sort options */}
        <div className="flex items-center gap-2 px-4 pb-2.5">
          {/* Filter button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 text-xs font-black shrink-0 active:scale-95 transition-all shadow-sm shadow-violet-500/10"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t.listing.filters}
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white text-[9px] font-black text-violet-600">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort scroll */}
          <div className="flex-1 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SORT_OPTIONS.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                  sortBy === key
                    ? 'border-violet-100 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                    : 'border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'
                }`}
              >
                {(t.listing as any)[labelKey] ?? labelKey}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Horizontally Scrolling Bar (Mobile only) */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto px-4 pb-2 bg-gray-50/50 dark:bg-gray-900/10 pt-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-t border-gray-100/50 dark:border-gray-900/50">
            {selectedBrand && (
              <span className="flex items-center gap-1 shrink-0 rounded-lg border border-violet-100 dark:border-violet-950 bg-violet-50/50 dark:bg-violet-950/20 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[selectedBrand] ?? '#555' }} />
                {brandLabel(selectedBrand)}
                <button onClick={() => setSelectedBrand(null)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {minRating > 0 && (
              <span className="flex items-center gap-1 shrink-0 rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                ★ {minRating}+
                <button onClick={() => setMinRating(0)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="flex items-center gap-1 shrink-0 rounded-lg border border-green-100 dark:border-green-950 bg-green-50/50 dark:bg-green-950/20 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                {minPrice ? formatSum(Number(minPrice.replace(/\s/g, ''))) : '0'} — {maxPrice ? formatSum(Number(maxPrice.replace(/\s/g, ''))) : '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selectedMarketplaces.map(mk => {
              const mp = MARKETPLACES.find(m => m.key === mk);
              return (
                <span key={mk} className="flex items-center gap-1 shrink-0 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-300">
                  {mp && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mp.color }} />}
                  {mp?.name ?? mk}
                  <button onClick={() => toggleMarketplace(mk)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              );
            })}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 shrink-0 rounded-lg border border-red-100 dark:border-red-950 bg-red-50/40 dark:bg-red-950/20 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" /> {t.listing.reset}
            </button>
          </div>
        )}
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

            {/* Sahifaning yagona h1 i. Mobil ko'rinishda tepadagi qidiruv
                paneli sarlavha vazifasini bajaradi, shuning uchun u yerda
                faqat skrin-riderlar uchun qoladi. */}
            <h1 className="sr-only md:not-sr-only md:mb-3 md:text-2xl md:font-black md:tracking-tight md:text-gray-900 md:dark:text-white">
              {pageHeading}
            </h1>

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
              <div className="hidden md:flex flex-wrap gap-1.5 mb-4">
                {selectedBrand && (
                  <span className="flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[selectedBrand] ?? '#555' }} />
                    {brandLabel(selectedBrand)}
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
          className="fixed inset-0 z-[60] md:hidden"
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
            className="absolute bottom-0 left-0 right-0 h-[80vh] max-h-[92vh] bg-white dark:bg-gray-950 flex flex-col overflow-hidden"
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

            {/* Content: Split tabbed layout */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-50 dark:bg-gray-900/50">
              {/* Left Tabs Column */}
              <div className="w-[38%] shrink-0 border-r border-gray-100/80 dark:border-gray-800/80 bg-white dark:bg-gray-950 overflow-y-auto flex flex-col divide-y divide-gray-100/50 dark:divide-gray-900/50">
                {([
                  { key: 'category' as const, label: t.listing.categories },
                  { key: 'price'    as const, label: t.listing.priceRange },
                  { key: 'brand'    as const, label: t.listing.brands },
                  { key: 'store'    as const, label: t.listing.stores },
                  { key: 'specs'    as const, label: 'Xususiyatlar' },
                  { key: 'rating'   as const, label: t.listing.rating },
                ] as const).map(tab => {
                  const active = activeFilterTab === tab.key;
                  // Compute subtitle
                  const allLabel = language === 'uz' ? 'Barchasi' : 'Все';
                  let sub = allLabel;
                  if (tab.key === 'category') sub = categoryLabel[draftCategory] ?? draftCategory;
                  else if (tab.key === 'price') {
                    if (draftMinPrice || draftMaxPrice) sub = `${draftMinPrice || '0'}-${draftMaxPrice || '∞'}`;
                  }
                  else if (tab.key === 'brand') sub = draftBrand ? brandLabel(draftBrand) : allLabel;
                  else if (tab.key === 'store') sub = draftMarketplaces.length > 0 ? `${draftMarketplaces.length} ta` : allLabel;
                  else if (tab.key === 'rating') sub = draftRating > 0 ? `★ ${draftRating}+` : allLabel;
                  else if (tab.key === 'specs') {
                    const n = draftRam.length + draftStorage.length + (draftBattery > 0 ? 1 : 0);
                    sub = n > 0 ? `${n} ta` : allLabel;
                  }

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilterTab(tab.key)}
                      className={`flex flex-col items-start w-full px-4 py-3.5 text-left transition-all ${
                        active
                          ? 'border-l-4 border-violet-600 bg-violet-50/45 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 font-bold'
                          : 'border-l-4 border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-900/30'
                      }`}
                    >
                      <span className="text-[12px] uppercase tracking-wider font-extrabold leading-none">{tab.label}</span>
                      <span className={`text-[10px] truncate max-w-full mt-1.5 ${
                        active ? 'text-violet-500 font-semibold' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Tab Content Column */}
              <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 dark:bg-gray-900/20">
                {FilterPanel(true, activeFilterTab)}
              </div>
            </div>

            {/* Footer actions */}
            <div
              className="relative z-20 mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-4"
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
