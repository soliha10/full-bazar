import { Smartphone, Shirt, Home, Sparkles, Star, Heart, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {}

export function Landing({}: LandingProps) {
  const { products: allProducts, isLoading } = useProducts(1, 8);
  const featuredProducts = allProducts.slice(0, 4);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">

      {/* Hero Section */}
      <section className="px-4 mt-2 md:mt-12 max-w-7xl mx-auto">
        <div className="bg-[#0062FF] rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-lg shadow-blue-500/20">
          <div className="relative z-10 md:w-1/2">
            <h2 className="text-white text-3xl md:text-5xl font-bold leading-tight mb-3 md:mb-6 tracking-tight">
              {t.landing.hero.title}
            </h2>
            <p className="text-white/90 text-sm md:text-lg mb-6 md:mb-8 font-medium max-w-[280px] md:max-w-md">
              {t.landing.hero.subtitle}
            </p>
            <button className="bg-white text-[#0062FF] font-bold rounded-full px-6 py-3 md:px-8 md:py-4 text-sm md:text-base shadow-sm hover:scale-105 transition-transform">
              {t.landing.hero.cta}
            </button>
          </div>
          {/* Decorative graphic for desktop */}
          <div className="hidden md:block absolute right-0 top-0 w-1/2 h-full bg-white/10 skew-x-12 translate-x-16" />
        </div>
      </section>

      {/* Popular Categories */}
      <section className="mt-8 md:mt-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-5 md:mb-8">
          <h2 className="font-bold text-gray-900 text-xl md:text-2xl">{t.landing.categories.title}</h2>
          <Link to="/products" className="text-sm md:text-base text-[#0062FF] font-medium hover:underline">
            {t.landing.categories.viewAll}
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 md:gap-8 pb-4 hide-scrollbar snap-x">
          {[
            { name: t.landing.categories.electronics, icon: Smartphone },
            { name: t.landing.categories.fashion, icon: Shirt },
            { name: t.landing.categories.home, icon: Home },
            { name: t.landing.categories.beauty, icon: Sparkles },
            { name: t.landing.categories.sports, icon: Crosshair },
          ].map((cat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 snap-start min-w-[72px] md:min-w-[100px]">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <cat.icon className="w-6 h-6 md:w-8 md:h-8 text-gray-800" strokeWidth={1.5} />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-600">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="mt-8 md:mt-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-5 md:mb-8">
          <h2 className="font-bold text-gray-900 text-xl md:text-2xl">{t.landing.trending.title}</h2>
          <Link to="/products" className="text-sm md:text-base text-[#0062FF] font-medium hover:underline">
            {t.landing.trending.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading && featuredProducts.length === 0 ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl aspect-3/4 animate-pulse" />
            ))
          ) : (
            featuredProducts.map((product, idx) => (
              <div key={product.id || idx} className="flex flex-col group">
                <div className="bg-[#F9FAFB] rounded-2xl aspect-square p-4 mb-3 relative overflow-hidden flex items-center justify-center group-hover:shadow-md transition-shadow">
                  {/* Fallback image if product image lacks */}
                  <img src={product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"} alt={product.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform" />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-500 font-medium">4.8 (1.2k reviews)</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 leading-tight mb-2">
                  {product.name}
                </h3>
                <div className="mt-auto">
                  <div className="text-[#0062FF] font-bold text-base md:text-lg mb-2">
                    {product.price ? `From $${product.price}` : 'From $349.99'}
                  </div>
                  <button className="w-full border border-blue-200 text-[#0062FF] font-bold text-sm py-2 rounded-xl hover:bg-blue-50 transition-colors">
                    {t.landing.trending.comparePrices}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* How Bazarcom Works */}
      <section className="mt-10 md:mt-24 px-4 pb-8 max-w-7xl mx-auto">
        <h2 className="font-bold text-gray-900 text-xl md:text-2xl mb-6 text-center md:text-left">{t.landing.howItWorks.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.landing.howItWorks.steps.map((item, idx) => (
            <div key={idx} className="flex md:flex-col items-start gap-4 p-4 rounded-2xl bg-[#F9FAFB] md:bg-transparent">
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#0062FF] text-white flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}