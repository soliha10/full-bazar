import { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import { ProductCard, Product } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useProducts } from '../hooks/useProducts';
import { useSearchParams } from 'react-router-dom';

interface ProductListingProps {
  onAddToCart: (product: Product) => void;
}

export function ProductListing({ onAddToCart }: ProductListingProps) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1E1E1E] mb-2">Discover Products</h1>
          <p className="text-gray-600">Showing {filteredProducts.length} products</p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <div className="bg-white rounded-xl p-6 sticky top-24 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg text-[#1E1E1E]">Filters</h2>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setPriceRange('all');
                    setMinRating(0);
                  }}
                  className="text-sm text-[#FF7A00] hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-[#1E1E1E] mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="w-4 h-4 text-[#FF7A00] focus:ring-[#FF7A00]"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-[#FF7A00]">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-[#1E1E1E] mb-3">Price Range</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'all'}
                      onChange={() => setPriceRange('all')}
                      className="w-4 h-4 text-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#FF7A00]">All Prices</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'under1m'}
                      onChange={() => setPriceRange('under1m')}
                      className="w-4 h-4 text-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#FF7A00]">Under 1 mln so'm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === '1to3m'}
                      onChange={() => setPriceRange('1to3m')}
                      className="w-4 h-4 text-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#FF7A00]">1 mln - 3 mln so'm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'over3m'}
                      onChange={() => setPriceRange('over3m')}
                      className="w-4 h-4 text-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#FF7A00]">Over 3 mln so'm</span>
                  </label>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="font-medium text-[#1E1E1E] mb-3">Minimum Rating</h3>
                <div className="space-y-2">
                  {[0, 4, 4.5].map(rating => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => setMinRating(rating)}
                        className="w-4 h-4 text-[#FF7A00] focus:ring-[#FF7A00]"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-[#FF7A00]">
                        {rating === 0 ? 'All Ratings' : `${rating}★ & Up`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl p-4 mb-6 flex justify-between items-center border border-gray-200">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-[#1E1E1E] hover:text-[#FF7A00]"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Products */}
            {loading && allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#FF7A00] animate-spin mb-4" />
                <p className="text-gray-500">Loading amazing deals...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#FF7A00] text-white px-6 py-2 rounded-lg hover:bg-[#E66E00] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                  ))}
                </div>
                
                {hasMore && (
                  <div className="mt-12 text-center">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Load More Products'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <p className="text-xl text-gray-600">No products found matching your filters.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setPriceRange('all');
                    setMinRating(0);
                  }}
                  className="mt-4 text-[#FF7A00] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
