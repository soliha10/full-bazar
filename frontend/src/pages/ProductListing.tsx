import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft, LayoutGrid, List, ArrowLeft, Mic, X, ChevronRight,
  Search, Loader2, SlidersHorizontal, Star, RotateCcw, Tag,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';

const BRANDS = [
  'Apple', 'Samsung', 'Redmi', 'Xiaomi', 'Poco',
  'Honor', 'Vivo', 'Oppo', 'Realme', 'Tecno', 'Infinix',
];

const BRAND_KEYWORDS: Record<string, string[]> = {
  Apple:   ['apple', 'iphone'],
  Samsung: ['samsung', 'galaxy'],
  Redmi:   ['redmi'],
  Xiaomi:  ['xiaomi', 'mi '],
  Poco:    ['poco'],
  Honor:   ['honor'],
  Vivo:    ['vivo'],
  Oppo:    ['oppo'],
  Realme:  ['realme'],
  Tecno:   ['tecno', 'camon', 'spark', 'pova'],
  Infinix: ['infinix'],
};

const MARKETPLACES = [
  { name: 'Asaxiy',     key: 'asaxiy',     color: '#7C3AED' },
  { name: 'Texnomart',  key: 'texnomart',  color: '#E31E24' },
  { name: 'Olcha',      key: 'olcha',      color: '#F97316' },
  { name: 'Mediapark',  key: 'mediapark',  color: '#10B981' },
  { name: 'Chakana',    key: 'chakana',    color: '#0EA5E9' },
  { name: 'Glotr',      key: 'glotr',      color: '#A78BFA' },
  { name: 'Olx',        key: 'olx',        color: '#4ADE80' },
  { name: 'Openshop',   key: 'openshop',   color: '#8B5CF6' },
  { name: 'Idea',       key: 'idea',       color: '#F59E0B' },
  { name: 'Brandstore', key: 'brandstore', color: '#6366F1' },
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

export function ProductListing() {
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [, setSearchParams] = useSearchParams();

  const searchQuery   = useMemo(() => new URLSearchParams(location.search).get('search') || '', [location.search]);
  const categoryParam = useMemo(() => new URLSearchParams(location.search).get('category') || 'All', [location.search]);

  const saved = useRef(getSavedFilters());

  const [localSearch,     setLocalSearch]     = useState(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedCategory,    setSelectedCategory]    = useState(categoryParam);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(saved.current?.selectedMarketplaces ?? []);
  const [minRating,    setMinRating]    = useState<number>(saved.current?.minRating ?? 0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(saved.current?.selectedBrand ?? null);
  const [minPrice,  setMinPrice]  = useState<string>(saved.current?.minPrice ?? '');
  const [maxPrice,  setMaxPrice]  = useState<string>(saved.current?.maxPrice ?? '');
  const [sortBy,    setSortBy]    = useState<SortKey>(saved.current?.sortBy ?? 'relevance');
  const [viewMode,  setViewMode]  = useState<'grid' | 'list'>(saved.current?.viewMode ?? 'grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listPage,  setListPage]  = useState(1);
  const [marketCounts, setMarketCounts] = useState<Record<string, number>>({});

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

  const LIST_PER_PAGE = 10;
  const categories    = ['All', 'Phones'];

  // ── Sync URL → state ──────────────────────────────────────────────────────
  useEffect(() => { setLocalSearch(searchQuery); setDebouncedSearch(searchQuery); }, [searchQuery]);
  useEffect(() => { setSelectedCategory(categoryParam); }, [categoryParam]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (localSearch.trim() === searchQuery) return;
    const t = setTimeout(() => {
      setDebouncedSearch(localSearch.trim());
      setSearchParams(prev => {
        const n = new URLSearchParams(prev);
        localSearch.trim() ? n.set('search', localSearch.trim()) : n.delete('search');
        return n;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, searchQuery, setSearchParams]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [debouncedSearch, selectedCategory]);
  useEffect(() => { setListPage(1); }, [debouncedSearch, selectedCategory, selectedMarketplaces, minRating, sortBy, viewMode]);

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
    useProducts(1, 20, debouncedSearch, selectedMarketplaces);

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
    if (minRating > 0) r = r.filter(p => p.rating >= minRating);
    if (selectedBrand) {
      const kws = BRAND_KEYWORDS[selectedBrand] ?? [selectedBrand.toLowerCase()];
      r = r.filter(p => kws.some(k => p.name.toLowerCase().includes(k)));
    }
    const mn = parseFloat(minPrice.replace(/\s/g, ''));
    const mx = parseFloat(maxPrice.replace(/\s/g, ''));
    if (!isNaN(mn) && mn > 0) r = r.filter(p => p.price >= mn);
    if (!isNaN(mx) && mx > 0) r = r.filter(p => p.price <= mx);

    if (sortBy === 'priceLow')  r.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceHigh') r.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')    r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [rawProducts, selectedCategory, minRating, selectedBrand, minPrice, maxPrice, sortBy]);

  const paginatedList = useMemo(() => {
    if (viewMode !== 'list') return filteredProducts;
    const s = (listPage - 1) * LIST_PER_PAGE;
    return filteredProducts.slice(s, s + LIST_PER_PAGE);
  }, [filteredProducts, viewMode, listPage]);
  const listTotalPages = Math.ceil(filteredProducts.length / LIST_PER_PAGE);

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
    setListPage(1);
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

  // ── Shared filter panel ───────────────────────────────────────────────────
  const FilterPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`space-y-7 ${mobile ? '' : ''}`}>
      {/* Categories */}
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          {t.listing.categories}
        </h4>
        <div className="space-y-1">
          {categories.map(cat => {
            const disabled = cat !== 'All' && cat !== 'Phones';
            return (
              <button
                key={cat}
                onClick={() => !disabled && handleCategoryChange(cat)}
                disabled={disabled}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-800/50'
                    : disabled
                      ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{cat}</span>
                {disabled && (
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[9px] font-bold text-gray-400 dark:text-gray-500">
                    {t.listing.comingSoon}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <Tag className="w-3 h-3" />
            {t.listing.priceRange}
          </h4>
          {(minPrice || maxPrice) && (
            <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline">
              {t.listing.reset}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="number"
              placeholder={t.listing.minPrice}
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder={t.listing.maxPrice}
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
          </div>
        </div>
        <p className="text-[9px] text-gray-400 dark:text-gray-600 font-medium mt-1.5 text-center">{t.listing.currency}</p>
      </div>

      {/* Rating */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-current" />
            {t.listing.rating}
          </h4>
          {minRating > 0 && (
            <button onClick={() => setMinRating(0)} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline">
              {t.listing.reset}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 3, 4, 4.5].map(r => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`rounded-xl px-3 py-2.5 text-xs font-black transition-all ${
                minRating === r
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400'
              }`}
            >
              {r === 0 ? t.listing.anyRating : (
                <span className="flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-current" />{r}+
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t.listing.brands}</h4>
          {selectedBrand && (
            <button onClick={() => setSelectedBrand(null)} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline">
              {t.listing.reset}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map(brand => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedBrand === brand
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Marketplaces */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t.listing.marketplaces}</h4>
          {selectedMarketplaces.length > 0 && (
            <button onClick={() => setSelectedMarketplaces([])} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline">
              {t.listing.reset}
            </button>
          )}
        </div>
        <div className="space-y-1">
          {MARKETPLACES.map(({ name, key, color }) => {
            const active = selectedMarketplaces.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleMarketplace(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                  active
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-800/50'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="flex-1">{name}</span>
                {marketCounts[key] !== undefined && !active && (
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    {marketCounts[key]}
                  </span>
                )}
                {active && (
                  <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
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
            <h1 className="text-base font-black text-gray-900 dark:text-white">
              {t.listing.title}
            </h1>
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

          {/* Mobile search */}
          <form onSubmit={e => { e.preventDefault(); setDebouncedSearch(localSearch.trim()); }} className="relative mb-3">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="h-12 w-full rounded-2xl bg-gray-100 dark:bg-gray-800 pl-12 pr-28 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-violet-400/30 transition-all"
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

          {/* Mobile sort chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { k: 'grid' as const,  label: t.listing.grid,  icon: <LayoutGrid className="h-3.5 w-3.5" /> },
              { k: 'list' as const,  label: t.listing.list,  icon: <List className="h-3.5 w-3.5" /> },
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
      <div className="mx-auto max-w-7xl px-4 py-4 pb-24 sm:px-6 lg:px-8 md:py-8 md:pb-12">
        {/* Breadcrumb */}
        <nav className="mb-6 hidden items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500 md:flex">
          <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-4 w-4 opacity-50" />
          <span className="font-black text-gray-900 dark:text-white">
            {debouncedSearch ? `${t.listing.searchResults}: ${debouncedSearch}` : t.listing.products}
          </span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ── Desktop sidebar ── */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-violet-500" />
                  {t.listing.filters}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 bg-violet-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t.listing.reset}
                  </button>
                )}
              </div>
              {/* Scrollable filter body */}
              <div className="overflow-y-auto flex-1 p-6 scrollbar-thin">
                <FilterPanel />
              </div>
            </div>
          </aside>

          {/* ── Product grid ── */}
          <section className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {isLoading
                    ? t.common.loading
                    : `${filteredProducts.length} / ${total} ${t.listing.found}`}
                </p>
                <div className="hidden md:flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-1 shadow-sm">
                  {/* View toggle */}
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1" />
                  {/* Sort buttons */}
                  {SORT_OPTIONS.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        sortBy === key
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {(t.listing as any)[labelKey] ?? labelKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedBrand && (
                    <span className="flex items-center gap-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold px-3 py-1 rounded-full">
                      {selectedBrand}
                      <button onClick={() => setSelectedBrand(null)} className="ml-1 hover:text-violet-900 dark:hover:text-violet-200"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                      ★ {minRating}+
                      <button onClick={() => setMinRating(0)} className="ml-1"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                      {minPrice ? formatSum(Number(minPrice)) : '0'} — {maxPrice ? formatSum(Number(maxPrice)) : '∞'}
                      <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="ml-1"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedMarketplaces.map(mk => (
                    <span key={mk} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full capitalize">
                      {mk}
                      <button onClick={() => toggleMarketplace(mk)} className="ml-1"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Products */}
            {isLoading ? (
              <div className="flex justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
                    <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-violet-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t.common.loading}</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-violet-500" />
                </div>
                <h3 className="mb-2 text-xl font-black text-gray-900 dark:text-white">{t.listing.noProductsFound}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.listing.noProductsDesc}</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-sm shadow-violet-500/20 hover:bg-violet-700 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t.listing.reset}
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 md:gap-5">
                  {filteredProducts.map(p => <ProductCard key={p.id} product={p} activeMarkets={selectedMarketplaces} />)}
                </div>
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={isFetchingNextPage}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                    >
                      {isFetchingNextPage ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />{t.common.loading}</>
                      ) : t.listing.loadMore}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {paginatedList.map(p => <ProductCard key={p.id} product={p} viewMode="list" activeMarkets={selectedMarketplaces} />)}
                </div>
                {listTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setListPage(p => Math.max(p - 1, 1))}
                      disabled={listPage === 1}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-black text-gray-700 dark:text-gray-300 px-4">
                      {listPage} / {listTotalPages}
                    </span>
                    <button
                      onClick={() => setListPage(p => Math.min(p + 1, listTotalPages))}
                      disabled={listPage === listTotalPages}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
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
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-[28px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col">
            {/* Handle + header */}
            <div className="sticky top-0 rounded-t-[28px] border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pb-4 pt-3 z-10">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-violet-500" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{t.listing.filters}</h3>
                  {activeFilterCount > 0 && (
                    <span className="bg-violet-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{activeFilterCount}</span>
                  )}
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-5 pb-32 flex-1">
              <FilterPanel mobile />
            </div>

            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 safe-area-bottom">
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3.5 text-sm font-black text-gray-700 dark:text-gray-300 hover:border-violet-200 dark:hover:border-violet-800 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t.listing.reset}
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-2xl bg-violet-600 hover:bg-violet-700 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95"
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
