import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LayoutGrid, List, ArrowLeft, Mic, X, ChevronRight, ChevronDown,
  Search, Loader2, SlidersHorizontal, RotateCcw, Tag,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';
import { trackEvent } from '../services/tracking';

const BRANDS = [
  'Apple', 'Samsung', 'Redmi', 'Xiaomi', 'Poco',
  'Honor', 'Vivo', 'Oppo', 'Realme', 'Tecno', 'Infinix',
];

const BRAND_COLORS: Record<string, string> = {
  Apple:   '#6B7280',
  Samsung: '#1428A0',
  Redmi:   '#FF6900',
  Xiaomi:  '#F97316',
  Poco:    '#FFCD00',
  Honor:   '#CF0A2C',
  Vivo:    '#415FFF',
  Oppo:    '#1D8348',
  Realme:  '#FFD700',
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
  { name: 'Beemarket',  key: 'beemarket',  color: '#EC4899' },
  { name: 'Castore',    key: 'castore',    color: '#14B8A6' },
  { name: 'Joybox',     key: 'joybox',     color: '#F43F5E' },
  { name: 'Alif',       key: 'alif',       color: '#0891B2' },
  { name: 'Discont',    key: 'discont',    color: '#EF4444' },
  { name: 'Macbro',     key: 'macbro',     color: '#1D4ED8' },
  { name: 'Radius',     key: 'radius',     color: '#84CC16' },
  { name: 'Mi',         key: 'mi',         color: '#FF6900' },
  { name: 'Ucell',      key: 'ucell',      color: '#65A30D' },
  { name: 'Prom',       key: 'prom',       color: '#B45309' },
];

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

// ── Accordion section — defined outside so hooks stay stable ─────────────────
function FilterSection({
  title, activeCount = 0, onReset, defaultOpen = true, children,
}: {
  title: string;
  activeCount?: number;
  onReset?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 py-3 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && onReset && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onReset(); }}
              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onReset?.())}
              className="text-[10px] font-bold text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:underline cursor-pointer"
            >
              Tozalash
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

// ── Custom checkbox ───────────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
      checked
        ? 'bg-violet-600 border-violet-600'
        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
    }`}>
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProductListing() {
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [, setSearchParams] = useSearchParams();

  const searchQuery   = useMemo(() => new URLSearchParams(location.search).get('search') || '', [location.search]);
  const categoryParam = useMemo(() => new URLSearchParams(location.search).get('category') || 'All', [location.search]);

  const saved = useRef(getSavedFilters());

  const [localSearch,       setLocalSearch]       = useState(searchQuery);
  const [debouncedSearch,   setDebouncedSearch]   = useState(searchQuery);
  const [selectedCategory,     setSelectedCategory]     = useState(categoryParam);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(saved.current?.selectedMarketplaces ?? []);
  const [minRating,    setMinRating]    = useState<number>(saved.current?.minRating ?? 0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(saved.current?.selectedBrand ?? null);
  const [minPrice,  setMinPrice]  = useState<string>(saved.current?.minPrice ?? '');
  const [maxPrice,  setMaxPrice]  = useState<string>(saved.current?.maxPrice ?? '');
  const [sortBy,    setSortBy]    = useState<SortKey>(saved.current?.sortBy ?? 'relevance');
  const [viewMode,  setViewMode]  = useState<'grid' | 'list'>(saved.current?.viewMode ?? 'grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [marketCounts, setMarketCounts] = useState<Record<string, number>>({});
  const [brandSearch,   setBrandSearch]   = useState('');
  const [marketSearch,  setMarketSearch]  = useState('');

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef  = useRef(false);
  const fetchingRef = useRef(false);
  const loadMoreRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !fetchingRef.current)
          loadMoreRef.current();
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch('/api/markets')
      .then(r => r.json())
      .then((d: { markets: { key: string; count: number }[] }) => {
        const counts: Record<string, number> = {};
        for (const m of d.markets) counts[m.key] = m.count;
        setMarketCounts(counts);
      })
      .catch(() => {});
  }, []);

  const categories = ['All', 'Phones'];
  const categoryLabel: Record<string, string> = {
    All:    t.listing.all,
    Phones: t.detail.categories.phones,
  };

  useEffect(() => { setLocalSearch(searchQuery); setDebouncedSearch(searchQuery); }, [searchQuery]);
  useEffect(() => { setSelectedCategory(categoryParam); }, [categoryParam]);

  useEffect(() => {
    if (localSearch.trim() === searchQuery) return;
    const timer = setTimeout(() => {
      const q = localSearch.trim();
      setDebouncedSearch(q);
      setSearchParams(prev => {
        const n = new URLSearchParams(prev);
        q ? n.set('search', q) : n.delete('search');
        return n;
      }, { replace: true });
      if (q) trackEvent('search', undefined, q);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchParams]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({
      selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode,
    }));
  }, [selectedMarketplaces, minRating, selectedBrand, minPrice, maxPrice, sortBy, viewMode]);

  const updateUrlCategory = useCallback((v: string) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      v && v !== 'All' ? n.set('category', v) : n.delete('category');
      return n;
    }, { replace: true });
  }, [setSearchParams]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const { products: rawProducts, isLoading, isFetchingNextPage, hasMore, loadMore, total } =
    useProducts(1, 20, debouncedSearch, selectedMarketplaces, selectedBrand ?? '');

  hasMoreRef.current  = hasMore;
  fetchingRef.current = isFetchingNextPage;
  loadMoreRef.current = loadMore;

  // ── Client-side filters + sort ────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let r = [...rawProducts];
    if (selectedCategory !== 'All') {
      r = r.filter(p => {
        const c = (p.category ?? '').toLowerCase();
        const s = selectedCategory.toLowerCase();
        return c === s || (s === 'phones' && c === 'smartphones');
      });
    }
    if (selectedMarketplaces.length > 0) {
      const activeSet = new Set(selectedMarketplaces.map(m => m.toLowerCase()));
      r = r.filter(p => p.markets?.some(m => activeSet.has(m.source.toLowerCase())));
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

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedCategory !== 'All') n++;
    if (minRating > 0) n++;
    if (selectedBrand) n++;
    if (selectedMarketplaces.length > 0) n += selectedMarketplaces.length;
    if (minPrice || maxPrice) n++;
    return n;
  }, [selectedCategory, minRating, selectedBrand, selectedMarketplaces, minPrice, maxPrice]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedMarketplaces([]);
    setMinRating(0);
    setSelectedBrand(null);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('relevance');
    updateUrlCategory('All');
  };

  const toggleMarketplace = useCallback((key: string) => {
    setSelectedMarketplaces(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const handleCategoryChange = (cat: string) => { setSelectedCategory(cat); updateUrlCategory(cat); };

  const handleVoiceSearch = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.onstart = () => setIsListening(true);
    r.onend   = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? '';
      setLocalSearch(text);
      setDebouncedSearch(text.trim());
    };
    r.start();
  };

  const filteredBrands   = brandSearch  ? BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))  : BRANDS;
  const filteredMarkets  = marketSearch ? MARKETPLACES.filter(m => m.name.toLowerCase().includes(marketSearch.toLowerCase())) : MARKETPLACES;

  // ── Filter panel ──────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-0">

      {/* Categories */}
      <FilterSection title={t.listing.categories} defaultOpen>
        <div className="flex flex-col gap-0.5">
          {categories.map(cat => {
            const disabled = cat !== 'All' && cat !== 'Phones';
            const active   = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => !disabled && handleCategoryChange(cat)}
                disabled={disabled}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all ${
                  active
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : disabled
                      ? 'cursor-not-allowed opacity-40'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                  active ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-violet-600" />}
                </div>
                <span className="text-xs font-semibold">{categoryLabel[cat] ?? cat}</span>
                {disabled && <span className="ml-auto text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">{t.listing.comingSoon}</span>}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection
        title={t.listing.priceRange}
        activeCount={minPrice || maxPrice ? 1 : 0}
        onReset={() => { setMinPrice(''); setMaxPrice(''); }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="number"
              placeholder={t.listing.minPrice}
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-full pl-7 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
          </div>
          <div className="relative">
            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="number"
              placeholder={t.listing.maxPrice}
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-full pl-7 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
          </div>
        </div>
        <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1.5 text-center">{t.listing.currency}</p>
      </FilterSection>

      {/* Rating */}
      <FilterSection
        title={t.listing.rating}
        activeCount={minRating > 0 ? 1 : 0}
        onReset={() => setMinRating(0)}
      >
        <div className="grid grid-cols-4 gap-1">
          {[0, 3, 4, 4.5].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`rounded-lg py-2 text-[11px] font-black transition-all ${
                minRating === r
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600'
              }`}
            >
              {r === 0 ? 'Barchasi' : `★${r}+`}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ── Brands — accordion + searchable checkbox list ── */}
      <FilterSection
        title={t.listing.brands}
        activeCount={selectedBrand ? 1 : 0}
        onReset={() => setSelectedBrand(null)}
      >
        {/* Search within brands */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="Brend qidirish..."
            value={brandSearch}
            onChange={e => setBrandSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
          />
        </div>
        <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
          {filteredBrands.map(brand => {
            const isSelected = selectedBrand === brand;
            const color = BRAND_COLORS[brand] ?? '#6B7280';
            return (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(isSelected ? null : brand)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all ${
                  isSelected
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Checkbox checked={isSelected} />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-xs font-semibold">{brand}</span>
              </button>
            );
          })}
          {filteredBrands.length === 0 && (
            <p className="py-3 text-center text-xs text-gray-400">Topilmadi</p>
          )}
        </div>
      </FilterSection>

      {/* ── Marketplaces — accordion + searchable checkbox list ── */}
      <FilterSection
        title={t.listing.marketplaces}
        activeCount={selectedMarketplaces.length}
        onReset={() => setSelectedMarketplaces([])}
      >
        {/* Search within markets */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="Market qidirish..."
            value={marketSearch}
            onChange={e => setMarketSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
          />
        </div>
        <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
          {filteredMarkets.map(({ name, key, color }) => {
            const active = selectedMarketplaces.includes(key);
            const count  = marketCounts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleMarketplace(key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all ${
                  active
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Checkbox checked={active} />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-xs font-semibold">{name}</span>
                {count !== undefined && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tabular-nums">
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
          {filteredMarkets.length === 0 && (
            <p className="py-3 text-center text-xs text-gray-400">Topilmadi</p>
          )}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-violet-100 dark:selection:bg-violet-900/30">

      {/* ── Mobile sticky header ── */}
      <div className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md md:hidden">
        <div className="px-4 pt-3 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-black text-gray-900 dark:text-white">{t.listing.title}</h1>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <form onSubmit={e => { e.preventDefault(); setDebouncedSearch(localSearch.trim()); }} className="relative mb-3">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="h-11 w-full rounded-2xl bg-gray-100 dark:bg-gray-800 pl-11 pr-28 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-400/30 transition-all"
              placeholder={t.nav.searchPlaceholder}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {localSearch && (
                <button type="button" onClick={() => setLocalSearch('')} className="flex h-8 w-8 items-center justify-center rounded-full">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <button type="button" onClick={handleVoiceSearch} className="flex h-8 w-8 items-center justify-center rounded-full">
                <Mic className={`h-4 w-4 transition-all ${isListening ? 'scale-125 animate-pulse text-red-500' : 'text-violet-600'}`} />
              </button>
              <button type="submit" className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-black text-white">
                {t.nav.search}
              </button>
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { k: 'grid' as const, label: t.listing.grid, icon: <LayoutGrid className="h-3.5 w-3.5" /> },
              { k: 'list' as const, label: t.listing.list, icon: <List className="h-3.5 w-3.5" /> },
            ].map(({ k, label, icon }) => (
              <button
                key={k}
                onClick={() => setViewMode(k)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${
                  viewMode === k ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700'
                }`}
              >
                {icon}{label}
              </button>
            ))}
            {SORT_OPTIONS.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${
                  sortBy === key ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700'
                }`}
              >
                {(t.listing as any)[labelKey] ?? labelKey}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="mx-auto max-w-7xl px-4 py-4 pb-20 sm:px-6 lg:px-8 md:py-8 md:pb-12">
        <nav className="mb-6 hidden items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500 md:flex">
          <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-4 w-4 opacity-50" />
          <span className="font-black text-gray-900 dark:text-white">
            {debouncedSearch ? `${t.listing.searchResults}: ${debouncedSearch}` : t.listing.products}
          </span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <span className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-violet-500" />
                  {t.listing.filters}
                  {activeFilterCount > 0 && (
                    <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[11px] font-bold text-violet-500 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" /> Hammasi
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 px-4 py-3 scrollbar-thin">
                <FilterPanel />
              </div>
            </div>
          </aside>

          {/* ── Products ── */}
          <section className="flex-1 min-w-0">
            <div className="mb-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {isLoading
                    ? t.common.loading
                    : `${filteredProducts.length} / ${total} ${t.listing.found}`}
                </p>
                <div className="hidden md:flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <div className="w-px h-5 bg-gray-100 dark:bg-gray-800 mx-0.5" />
                  {SORT_OPTIONS.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sortBy === key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {(t.listing as any)[labelKey] ?? labelKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedBrand && (
                    <span className="flex items-center gap-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[selectedBrand] ?? '#6B7280' }} />
                      {selectedBrand}
                      <button onClick={() => setSelectedBrand(null)}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      ★ {minRating}+
                      <button onClick={() => setMinRating(0)}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      {minPrice ? formatSum(Number(minPrice)) : '0'} — {maxPrice ? formatSum(Number(maxPrice)) : '∞'}
                      <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedMarketplaces.map(mk => {
                    const mp = MARKETPLACES.find(m => m.key === mk);
                    return (
                      <span key={mk} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">
                        {mp && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mp.color }} />}
                        {mp?.name ?? mk}
                        <button onClick={() => toggleMarketplace(mk)}><X className="w-3 h-3" /></button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
                    <Loader2 className="absolute inset-0 m-auto w-5 h-5 text-violet-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">{t.common.loading}</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="mb-2 text-xl font-black text-gray-900 dark:text-white">{t.listing.noProductsFound}</h3>
                <p className="text-sm text-gray-500 mb-6">{t.listing.noProductsDesc}</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-sm shadow-violet-500/20 hover:bg-violet-700 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />{t.listing.reset}
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 md:gap-5">
                    {filteredProducts.map(p => <ProductCard key={p.id} product={p} activeMarkets={selectedMarketplaces} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredProducts.map(p => <ProductCard key={p.id} product={p} viewMode="list" activeMarkets={selectedMarketplaces} />)}
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="mt-8 flex items-center justify-center h-10">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                      <span className="font-medium">{t.common.loading}</span>
                    </div>
                  )}
                  {!hasMore && filteredProducts.length > 0 && (
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-600">
                      — {total} ta mahsulot ko'rsatildi —
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[24px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col">
            <div className="sticky top-0 rounded-t-[24px] border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pb-3 pt-3 z-10">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-violet-500" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">{t.listing.filters}</h3>
                  {activeFilterCount > 0 && (
                    <span className="bg-violet-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                  )}
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-4 py-3 pb-32 flex-1">
              <FilterPanel />
            </div>
            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-black text-gray-700 dark:text-gray-300"
              >
                <RotateCcw className="w-4 h-4" />{t.listing.reset}
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20"
              >
                {t.listing.viewResults}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
