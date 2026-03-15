import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  LayoutGrid,
  List,
  ArrowLeft,
  Mic,
  X,
  Check,
  ChevronRight,
  Search,
  Loader2,
  Filter
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
  
  // ─── URL query params ───────────────────────────────────────────────────────
  // Derive searchQuery directly from location.search for maximum reactivity
  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  }, [location.search]);

  const categoryParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || 'All';
  }, [location.search]);

  // ─── Local UI state ─────────────────────────────────────────────────────────
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const marketplaces = ['Amazon', 'eBay', 'Walmart', 'Target', 'AliExpress', 'Best Buy'];

  // ─── commitSearch — yagona URL yangilash nuqtasi ─────────────────────────────
  const commitSearch = useCallback(
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

  // Keep local search sync with URL
  useEffect(() => {
    setLocalSearch(prev => (prev !== searchQuery ? searchQuery : prev));
  }, [searchQuery]);

  // Debounced live-search: 400ms delay
  useEffect(() => {
    if (localSearch.trim() === searchQuery) return;
    const timer = setTimeout(() => commitSearch(localSearch), 400);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, commitSearch]);

  // Keep category in sync with URL
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Scroll to top on search/category change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, selectedCategory]);

  // ─── Fetch products using TanStack Query ─────────────────────────────────────
  const { 
    products: rawProducts, 
    isLoading, 
    isFetching,
    isFetchingNextPage, 
    hasMore, 
    loadMore,
    total
  } = useProducts(1, 48, searchQuery);

  // ─── Client-side filters (applied on top of backend search) ─────────────────
  const filteredProducts = useMemo(() => {
    let result = [...rawProducts];

    // Category filter
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

    // Marketplace filter
    if (selectedMarketplaces.length > 0) {
      result = result.filter(p => p.source && selectedMarketplaces.includes(p.source));
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // Sort
    if (sortBy === 'priceLow') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [rawProducts, selectedCategory, selectedMarketplaces, minRating, sortBy]);

  // Handlers
  const handleLocalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitSearch(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    commitSearch('');
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLocalSearch(transcript);
      commitSearch(transcript);
    };
    recognition.start();
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedMarketplaces([]);
    setMinRating(0);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] selection:bg-blue-100">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{t.listing.title || 'Search Results'}</h1>
          <button className="p-1" onClick={() => setIsMobileFilterOpen(true)}><Filter className="w-6 h-6 text-gray-400" /></button>
        </div>

        <form onSubmit={handleLocalSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-[#F3F4F6] pl-12 pr-[6.5rem] py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder={t.nav.searchPlaceholder || "Search products..."}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localSearch && <button type="button" onClick={handleClearSearch} className="p-1.5"><X className="w-4 h-4 text-gray-400" /></button>}
            <button type="button" onClick={handleVoiceSearch} className="p-1.5">
              <Mic className={`w-4 h-4 transition-all ${isListening ? 'text-red-500 animate-pulse scale-125' : 'text-[#0062FF]'}`} />
            </button>
            {isFetching && !isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-1" />}
            <button type="submit" className="bg-[#0062FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all">Qidirish</button>
          </div>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-12">
        {/* Desktop Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-400 mb-6 font-medium">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-gray-900 font-bold">{searchQuery ? `Search: ${searchQuery}` : 'Products'}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{t.listing.filters}</h3>
                <button onClick={handleResetFilters} className="text-xs font-bold text-[#0062FF] hover:underline uppercase tracking-wider">{t.listing.reset}</button>
              </div>
              
              <div className="space-y-8">
                {/* Categories */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.listing.categories}</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                    {['All', 'Electronics', 'Phones', 'Laptops', 'Watch'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-blue-50 text-[#0062FF]' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marketplace */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Marketplaces</h4>
                  <div className="space-y-3">
                    {marketplaces.map(m => (
                      <label key={m} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div onClick={() => {
                            setSelectedMarketplaces(prev => prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m])
                          }} className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 ${selectedMarketplaces.includes(m) ? 'bg-[#0062FF] border-[#0062FF]' : 'bg-gray-50 border-gray-100 group-hover:border-blue-200'}`}>
                            {selectedMarketplaces.includes(m) && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                          </div>
                          <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{m}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1">
            <div className="hidden md:flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {(isLoading || (isFetching && rawProducts.length === 0))
                    ? 'Qidirilmoqda...' 
                    : searchQuery 
                      ? `"${searchQuery}" bo'yicha ${total} natija`
                      : `${total} mahsulot topildi`
                  }
                </h2>
                {isFetching && !isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-[#0062FF]' : 'text-gray-400'}`}><LayoutGrid className="w-5 h-5" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-50 text-[#0062FF]' : 'text-gray-400'}`}><List className="w-5 h-5" /></button>
                </div>
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none bg-white border border-gray-100 pl-4 pr-10 py-3 rounded-xl text-sm font-black text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer">
                    <option value="relevance">Relevance</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-4/5 bg-white rounded-4xl border border-gray-100 animate-pulse flex flex-col p-6 space-y-4">
                    <div className="flex-1 bg-gray-50 rounded-2xl" />
                    <div className="h-6 w-3/4 bg-gray-50 rounded-lg" />
                    <div className="h-4 w-1/2 bg-gray-50 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} viewMode={viewMode} />)}
              </div>
            ) : (
              <div className="bg-white rounded-4xl p-20 text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  {isFetching ? <Loader2 className="w-10 h-10 text-[#0062FF] animate-spin" /> : <Search className="w-10 h-10 text-[#0062FF]" />}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  {isFetching ? 'Qidirilmoqda...' : 'Mahsulot topilmadi'}
                </h3>
                <p className="text-gray-500 font-bold mb-8">
                  {isFetching ? 'Natijalar yuklanmoqda, iltimos kuting...' : 'Boshqa kalit so\'zlar bilan qidirib ko\'ring yoki filtrlarni tozalang.'}
                </p>
                {!isFetching && (
                  <div className="flex gap-4">
                    {searchQuery && <Button variant="outline" onClick={handleClearSearch} className="px-8 py-4 rounded-2xl font-black">Tozalash</Button>}
                    <Button variant="primary" onClick={handleResetFilters} className="px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20">Filtrlarni tozalash</Button>
                  </div>
                )}
              </div>
            )}

            {hasMore && (
              <div className="mt-16 text-center">
                <Button variant="outline" size="lg" onClick={loadMore} className="rounded-2xl px-16 py-5 border-2 border-gray-100 hover:border-[#0062FF] hover:text-[#0062FF] font-black transition-all transform active:scale-95 disabled:opacity-50">
                  {isFetchingNextPage ? <Loader2 className="w-6 h-6 animate-spin" /> : "KO'PROQ YUKLASH"}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-all md:hidden animate-in fade-in duration-300">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">Filters</h2>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-gray-50 rounded-xl"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            <div className="space-y-8 pb-10">
               <div>
                  <h3 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Electronics', 'Phones', 'Laptops'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => { setSelectedCategory(cat); setIsMobileFilterOpen(false); }} 
                        className={`px-5 py-2.5 rounded-full text-sm font-bold border ${selectedCategory === cat ? 'bg-blue-50 border-blue-200 text-[#0062FF]' : 'bg-white border-gray-100 text-gray-500'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
               </div>

               <Button fullWidth variant="primary" onClick={() => setIsMobileFilterOpen(false)} className="py-5 text-base font-black rounded-2xl shadow-xl shadow-blue-500/30">
                 Show Results
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
