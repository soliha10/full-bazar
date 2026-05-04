import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  LayoutGrid,
  List,
  ArrowLeft,
  Mic,
  X,
  ChevronRight,
  Search,
  Loader2,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useProducts } from '../hooks/useProducts';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function ProductListing() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  }, [location.search]);

  const categoryParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || 'All';
  }, [location.search]);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'priceLow' | 'priceHigh' | 'rating'>(
    'relevance',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listPage, setListPage] = useState(1);

  const LIST_ITEMS_PER_PAGE = 10;
  const categories = ['All', 'Phones', 'Electronics', 'Laptops', 'Watch'];

  const MARKETPLACES: { name: string; key: string; color: string }[] = [
    { name: 'Asaxiy',    key: 'asaxiy',    color: '#0EA5E9' },
    { name: 'Texnomart', key: 'texnomart', color: '#E31E24' },
    { name: 'Olcha',     key: 'olcha',     color: '#F97316' },
    { name: 'Mediapark', key: 'mediapark', color: '#10B981' },
    { name: 'Glotr',     key: 'glotr',     color: '#6366F1' },
    { name: 'Idea',      key: 'idea',      color: '#F59E0B' },
    { name: 'Ozon',      key: 'ozon',      color: '#005BFF' },
    { name: 'Discont',   key: 'discont',   color: '#EF4444' },
    { name: 'Premier',   key: 'premier',   color: '#8B5CF6' },
    { name: 'Beemarket', key: 'beemarket', color: '#F59E0B' },
    { name: 'Castore',   key: 'castore',   color: '#14B8A6' },
  ];

  const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Asus', 'HP', 'Sony'];

  const toggleMarketplace = useCallback((key: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count += 1;
    if (minRating > 0) count += 1;
    if (selectedMarketplaces.length > 0) count += selectedMarketplaces.length;
    return count;
  }, [selectedCategory, minRating, selectedMarketplaces]);

  const updateUrlSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          if (trimmed) {
            next.set('search', trimmed);
          } else {
            next.delete('search');
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const updateUrlCategory = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          if (value && value !== 'All') {
            next.set('category', value);
          } else {
            next.delete('category');
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    setLocalSearch(searchQuery);
    setDebouncedSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    const trimmedLocal = localSearch.trim();
    const trimmedUrl = searchQuery.trim();

    if (trimmedLocal === trimmedUrl) return;

    const timer = setTimeout(() => {
      setDebouncedSearch(trimmedLocal);
      updateUrlSearch(trimmedLocal);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, updateUrlSearch]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, selectedCategory, selectedMarketplaces, minRating, sortBy, viewMode]);

  const {
    products: rawProducts,
    isLoading,
    isFetchingNextPage,
    hasMore,
    loadMore,
    total,
  } = useProducts(1, 20, debouncedSearch, selectedMarketplaces);

  const filteredProducts = useMemo(() => {
    let result = [...rawProducts];

    if (selectedCategory !== 'All') {
      result = result.filter((p) => {
        const cat = p.category?.toLowerCase() ?? '';
        const sel = selectedCategory.toLowerCase();
        return (
          cat === sel ||
          (sel === 'phones' && cat === 'smartphones') ||
          (sel === 'electronics' && cat === 'phones')
        );
      });
    }

    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    if (selectedBrand) {
      result = result.filter((p) => p.name.toLowerCase().includes(selectedBrand.toLowerCase()));
    }

    if (sortBy === 'priceLow') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [rawProducts, selectedCategory, selectedMarketplaces, minRating, sortBy]);

  const paginatedListProducts = useMemo(() => {
    if (viewMode !== 'list') return filteredProducts;
    const start = (listPage - 1) * LIST_ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + LIST_ITEMS_PER_PAGE);
  }, [filteredProducts, viewMode, listPage]);

  const listTotalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / LIST_ITEMS_PER_PAGE);
  }, [filteredProducts]);

  const handleLocalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localSearch.trim();
    setDebouncedSearch(trimmed);
    updateUrlSearch(trimmed);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setDebouncedSearch('');
    updateUrlSearch('');
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang =
      language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      setLocalSearch(transcript);
      setDebouncedSearch(transcript.trim());
      updateUrlSearch(transcript.trim());
    };

    recognition.start();
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedMarketplaces([]);
    setMinRating(0);
    setSortBy('relevance');
    setListPage(1);
    updateUrlCategory('All');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateUrlCategory(category);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-100">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md md:hidden">
        <div className="px-4 pt-3 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>

            <h1 className="text-base font-bold text-gray-900">
              {t.listing.title || 'Search Results'}
            </h1>

            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <Filter className="h-5 w-5 text-gray-600" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-[#0062FF] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <form onSubmit={handleLocalSearchSubmit} className="relative mb-3">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="h-12 w-full rounded-2xl bg-[#F3F4F6] pl-12 pr-[28px] text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              placeholder={t.nav.searchPlaceholder || 'Search products.'}
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}

              <button
                type="button"
                onClick={handleVoiceSearch}
                className="flex h-8 w-8 items-center justify-center rounded-full"
              >
                <Mic
                  className={`h-4 w-4 transition-all ${
                    isListening ? 'scale-125 animate-pulse text-red-500' : 'text-[#0062FF]'
                  }`}
                />
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[#0062FF] px-3 py-1.5 text-xs font-bold text-white"
              >
                {t.nav.search}
              </button>
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-[#0062FF]'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-[#0062FF]'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>

            <button
              onClick={() => setSortBy('relevance')}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                sortBy === 'relevance'
                  ? 'bg-blue-50 text-[#0062FF]'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
            >
              Relevance
            </button>

            <button
              onClick={() => setSortBy('priceLow')}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                sortBy === 'priceLow'
                  ? 'bg-blue-50 text-[#0062FF]'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
            >
              Price ↑
            </button>

            <button
              onClick={() => setSortBy('priceHigh')}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                sortBy === 'priceHigh'
                  ? 'bg-blue-50 text-[#0062FF]'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
            >
              Price ↓
            </button>

            <button
              onClick={() => setSortBy('rating')}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                sortBy === 'rating'
                  ? 'bg-blue-50 text-[#0062FF]'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
            >
              Rating
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 pb-24 sm:px-6 lg:px-8 md:py-8 md:pb-12">
        <nav className="mb-6 hidden items-center gap-2 text-sm font-medium text-gray-400 md:flex">
          <Link to="/" className="transition-colors hover:text-gray-900">
            {t.nav.home}
          </Link>
          <ChevronRight className="h-4 w-4 opacity-50" />
          <span className="font-bold text-gray-900">
            {debouncedSearch ? `${t.listing.searchResults}: ${debouncedSearch}` : t.listing.products}
          </span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 space-y-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight text-gray-900">
                  {t.listing.filters}
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold uppercase tracking-wider text-[#0062FF] hover:underline"
                >
                  {t.listing.reset}
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {t.listing.categories}
                  </h4>

                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                    {categories.map((cat) => {
                      const isDisabled = cat !== 'All' && cat !== 'Phones';

                      return (
                        <button
                          key={cat}
                          onClick={() => !isDisabled && handleCategoryChange(cat)}
                          disabled={isDisabled}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold transition-all ${
                            selectedCategory === cat
                              ? 'bg-blue-50 text-[#0062FF]'
                              : isDisabled
                                ? 'cursor-not-allowed text-gray-300'
                                : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span>{cat}</span>
                          {isDisabled && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                              {t.listing.comingSoon}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Brand filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Brendlar
                    </h4>
                    {selectedBrand && (
                      <button
                        onClick={() => setSelectedBrand(null)}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#0062FF] hover:underline"
                      >
                        Tozalash
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          selectedBrand === brand
                            ? 'bg-blue-50 text-[#0062FF] ring-1 ring-blue-200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marketplace filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Marketlar
                    </h4>
                    {selectedMarketplaces.length > 0 && (
                      <button
                        onClick={() => setSelectedMarketplaces([])}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#0062FF] hover:underline"
                      >
                        Tozalash
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
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all ${
                            active ? 'bg-blue-50 text-[#0062FF]' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          {name}
                          {active && (
                            <span className="ml-auto h-4 w-4 rounded-full bg-[#0062FF] flex items-center justify-center">
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {isLoading ? t.common.loading : `${filteredProducts.length} / ${total} ${t.listing.found}`}
                </p>

                <div className="hidden items-center gap-2 md:flex">
                  <button
                    onClick={() => setSortBy('relevance')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      sortBy === 'relevance'
                        ? 'bg-blue-50 text-[#0062FF]'
                        : 'border border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {t.listing.relevance}
                  </button>
                  <button
                    onClick={() => setSortBy('priceLow')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      sortBy === 'priceLow'
                        ? 'bg-blue-50 text-[#0062FF]'
                        : 'border border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {t.listing.priceAsc}
                  </button>
                  <button
                    onClick={() => setSortBy('priceHigh')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      sortBy === 'priceHigh'
                        ? 'bg-blue-50 text-[#0062FF]'
                        : 'border border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {t.listing.priceDesc}
                  </button>
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      sortBy === 'rating'
                        ? 'bg-blue-50 text-[#0062FF]'
                        : 'border border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {t.listing.rating}
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center md:p-10">
                <h3 className="mb-2 text-xl font-bold text-gray-900">{t.listing.noProductsFound}</h3>
                <p className="text-sm text-gray-500 md:text-base">
                  {t.listing.noProductsDesc}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button onClick={loadMore} disabled={isFetchingNextPage}>
                      {isFetchingNextPage ? t.common.loading : t.listing.loadMore}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {paginatedListProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {listTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setListPage((prev) => Math.max(prev - 1, 1))}
                      disabled={listPage === 1}
                      className="rounded-xl border border-gray-200 p-2 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="text-sm font-medium text-gray-600">
                      {listPage} / {listTotalPages}
                    </span>

                    <button
                      onClick={() =>
                        setListPage((prev) => Math.min(prev + 1, listTotalPages))
                      }
                      disabled={listPage === listTotalPages}
                      className="rounded-xl border border-gray-200 p-2 disabled:opacity-50"
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

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-label="Close filter"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 rounded-t-[28px] border-b border-gray-100 bg-white px-4 pb-4 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-bold text-gray-900">{t.listing.filters}</h3>
                </div>

                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6]"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto px-4 py-5 pb-28">
              <div>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">
                  {t.listing.category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isDisabled = cat !== 'All' && cat !== 'Phones';

                    return (
                      <button
                        key={cat}
                        onClick={() => !isDisabled && handleCategoryChange(cat)}
                        disabled={isDisabled}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          selectedCategory === cat
                            ? 'bg-[#0062FF] text-white'
                            : isDisabled
                              ? 'cursor-not-allowed bg-gray-100 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">
                  {t.listing.sortBy}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'relevance', label: t.listing.relevance },
                    { key: 'priceLow', label: t.listing.priceAsc },
                    { key: 'priceHigh', label: t.listing.priceDesc },
                    { key: 'rating', label: t.listing.rating },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() =>
                        setSortBy(item.key as 'relevance' | 'priceLow' | 'priceHigh' | 'rating')
                      }
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                        sortBy === item.key
                          ? 'bg-blue-50 text-[#0062FF] ring-1 ring-blue-200'
                          : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">
                  {t.listing.rating}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                        minRating === rating
                          ? 'bg-blue-50 text-[#0062FF] ring-1 ring-blue-200'
                          : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'
                      }`}
                    >
                      {rating === 0 ? t.listing.anyRating : `${rating}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">
                  Brendlar
                </h4>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        selectedBrand === brand
                          ? 'bg-[#0062FF] text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile marketplace filter */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Marketlar
                  </h4>
                  {selectedMarketplaces.length > 0 && (
                    <button
                      onClick={() => setSelectedMarketplaces([])}
                      className="text-[10px] font-bold uppercase tracking-wider text-[#0062FF]"
                    >
                      Tozalash
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {MARKETPLACES.map(({ name, key, color }) => {
                    const active = selectedMarketplaces.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleMarketplace(key)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                          active
                            ? 'bg-[#0062FF] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: active ? 'white' : color }}
                        />
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-3 border-t border-gray-100 bg-white px-4 py-4">
              <button
                onClick={handleResetFilters}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700"
              >
                {t.listing.reset}
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-2xl bg-[#0062FF] px-4 py-3 text-sm font-bold text-white"
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