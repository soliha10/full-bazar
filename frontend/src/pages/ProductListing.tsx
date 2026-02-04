import { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useProducts } from '../hooks/useProducts';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductListingProps {}

export function ProductListing({}: ProductListingProps) {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';

  const { products: allProducts, loading, error, hasMore, loadMore } = useProducts(1, 48, searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'All');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilters, setShowFilters] = useState(true);

  const categories = useMemo(() => ['All', ...Array.from(new Set(allProducts.map(p => p.category)))], [allProducts]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by price range (UZS)
    if (priceRange === 'under1m') {
      result = result.filter(p => p.price < 1000000);
    } else if (priceRange === '1to3m') {
      result = result.filter(p => p.price >= 1000000 && p.price <= 3000000);
    } else if (priceRange === 'over3m') {
      result = result.filter(p => p.price > 3000000);
    }

    // Filter by rating
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
  }, [allProducts, selectedCategory, priceRange, minRating, sortBy]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center md:text-left space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Bizning <span className="text-gradient">to'plamlarni</span> o'rganing</h1>
          <p className="text-muted-foreground font-medium">Qidirishingiz bo'yicha {filteredProducts.length} {t.listing.found}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Collapsible on Mobile */}
          <aside className={`${showFilters ? 'w-full lg:w-72' : 'w-0 hidden lg:block overflow-hidden'} transition-all duration-500`}>
            <div className="bg-card rounded-[2.5rem] p-8 sticky top-28 border border-border/50 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl text-foreground">{t.listing.filters}</h2>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setPriceRange('all');
                    setMinRating(0);
                  }}
                  className="text-sm font-bold text-primary hover:underline transition-all"
                >
                  {t.listing.reset}
                </button>
              </div>

              {/* Category Filter */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.listing.categories}</h3>
                <div className="space-y-3">
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category}
                          onChange={() => setSelectedCategory(category)}
                          className="peer appearance-none w-5 h-5 rounded-lg border-2 border-border checked:border-primary checked:bg-primary transition-all"
                        />
                        <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className={`text-sm font-bold transition-colors ${selectedCategory === category ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-4 pt-6 border-t border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.listing.priceRange}</h3>
                <div className="space-y-3">
                  {[
                    { id: 'all', label: t.listing.all },
                    { id: 'under1m', label: '1 mln so\'mdan past' },
                    { id: '1to3m', label: '1 - 3 mln so\'m' },
                    { id: 'over3m', label: '3 mln so\'mdan baland' }
                  ].map(range => (
                    <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="price"
                          checked={priceRange === range.id}
                          onChange={() => setPriceRange(range.id)}
                          className="peer appearance-none w-5 h-5 rounded-lg border-2 border-border checked:border-primary checked:bg-primary transition-all"
                        />
                        <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className={`text-sm font-bold transition-colors ${priceRange === range.id ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-4 pt-6 border-t border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.listing.rating}</h3>
                <div className="space-y-3">
                  {[0, 4, 4.5].map(rating => (
                    <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === rating}
                          onChange={() => setMinRating(rating)}
                          className="peer appearance-none w-5 h-5 rounded-lg border-2 border-border checked:border-primary checked:bg-primary transition-all"
                        />
                        <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className={`text-sm font-bold transition-colors ${minRating === rating ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                        {rating === 0 ? t.listing.all : `${rating}★ va undan yuqori`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-1 space-y-8">
            {/* Toolbar */}
            <div className="bg-card rounded-3xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-border/50 shadow-sm">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors px-4 py-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>{showFilters ? t.listing.hideFilters : t.listing.showFilters}</span>
              </button>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <span className="text-sm font-bold text-muted-foreground whitespace-nowrap hidden sm:block">{t.listing.sortBy}:</span>
                <div className="relative w-full md:w-64 group">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-muted/50 border border-border rounded-2xl px-5 py-3 pr-12 font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all cursor-pointer"
                  >
                    <option value="featured">{t.listing.sort.featured}</option>
                    <option value="priceLow">{t.listing.sort.priceLow}</option>
                    <option value="priceHigh">{t.listing.sort.priceHigh}</option>
                    <option value="rating">{t.listing.sort.rating}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary pointer-events-none transition-colors" />
                </div>
              </div>
            </div>

            {/* Products */}
            {loading && allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-bounce-subtle">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <p className="text-muted-foreground font-bold text-xl">Mahsulotlar qidirilmoqda...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-3xl p-12 text-center space-y-6">
                <p className="text-red-600 dark:text-red-400 font-bold text-lg">{error}</p>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                  className="rounded-2xl px-12 py-4"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                
                {hasMore && (
                  <div className="mt-16 text-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={loadMore}
                      disabled={loading}
                      className="rounded-2xl px-16 py-5 border-2 hover:bg-primary hover:text-white transition-all font-black text-lg"
                    >
                      {loading ? (
                        <span className="flex items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          LOADING...
                        </span>
                      ) : (
                        'LOAD MORE PRODUCTS'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-card rounded-[3rem] p-20 text-center border-2 border-dashed border-border flex flex-col items-center space-y-6">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                   <SlidersHorizontal className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black text-foreground">{t.listing.noMatches}</h3>
                <p className="text-muted-foreground font-medium max-w-md mx-auto">Siz tanlagan filtrlar bo'yicha hech qanday mahsulot topilmadi. Filtrni o'zgartirib ko'ring.</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedCategory('All');
                    setPriceRange('all');
                    setMinRating(0);
                  }}
                  className="font-bold text-primary hover:underline px-8"
                >
                  {t.listing.clearFilters}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

