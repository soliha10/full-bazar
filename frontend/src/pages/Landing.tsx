import { Smartphone, Star, ArrowRight, TrendingUp, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';
import { formatSum } from '../utils/productMapper';

const MARKET_LOGOS: { name: string; color: string }[] = [
  { name: 'Asaxiy',    color: '#0EA5E9' },
  { name: 'Texnomart', color: '#E31E24' },
  { name: 'Olcha',     color: '#F97316' },
  { name: 'Mediapark', color: '#10B981' },
  { name: 'Glotr',     color: '#6366F1' },
  { name: 'Idea',      color: '#F59E0B' },
  { name: 'Ozon',      color: '#005BFF' },
  { name: 'Discont',   color: '#EF4444' },
  { name: 'Premier',   color: '#8B5CF6' },
  { name: 'Beemarket', color: '#F59E0B' },
  { name: 'Castore',   color: '#14B8A6' },
];

export function Landing() {
  const { products: allProducts, isLoading, total } = useProducts(1, 8);
  const featuredProducts = allProducts.slice(0, 4);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-0">

      {/* ── Hero ── */}
      <section className="px-4 pt-4 md:pt-10 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0062FF] via-[#0047CC] to-[#1E3A8A] shadow-2xl shadow-blue-500/30 min-h-[320px] md:min-h-[420px] flex items-center">

          {/* background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
            <div className="absolute top-10 right-1/3 w-40 h-40 rounded-full bg-blue-300/10" />
            <div className="absolute -bottom-10 right-10 w-60 h-60 rounded-full bg-indigo-400/10" />
          </div>

          <div className="relative z-10 px-6 py-10 md:px-14 md:py-16 w-full flex flex-col md:flex-row items-center gap-8">
            {/* Left */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-5">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white/90 text-xs font-bold uppercase tracking-widest">
                  {total > 0 ? `${total.toLocaleString()}+ mahsulot` : 'Real-time narxlar'}
                </span>
              </div>

              <h1 className="text-white text-3xl md:text-5xl font-black leading-tight mb-4 tracking-tight max-w-lg">
                {t.landing.hero.title}
              </h1>
              <p className="text-white/80 text-sm md:text-lg mb-8 max-w-sm leading-relaxed">
                {t.landing.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#0062FF] font-black rounded-2xl px-7 py-4 text-sm md:text-base shadow-lg hover:shadow-white/25 hover:scale-105 active:scale-95 transition-all"
                >
                  {t.landing.hero.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/25 text-white font-bold rounded-2xl px-7 py-4 text-sm md:text-base hover:bg-white/20 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Narxlarni ko'rish
                </Link>
              </div>
            </div>

            {/* Right — stats card */}
            <div className="hidden md:flex flex-col gap-4 shrink-0">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 min-w-[240px]">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Live narxlar</p>
                {['Texnomart', 'Uzum', 'Olcha'].map((store, i) => (
                  <div key={store} className="flex items-center justify-between mb-3 last:mb-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-400' : 'bg-white/40'}`} />
                      <span className="text-white/80 text-sm font-medium">{store}</span>
                    </div>
                    <span className={`text-sm font-black ${i === 0 ? 'text-green-300' : 'text-white/60'}`}>
                      {i === 0 ? '✓ Eng arzon' : `+${(i * 8)}%`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{total > 0 ? total : '500'}+</p>
                  <p className="text-white/60 text-xs font-medium mt-1">Mahsulotlar</p>
                </div>
                <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">6</p>
                  <p className="text-white/60 text-xs font-medium mt-1">Do'konlar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="mt-5 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[
            { icon: RefreshCw,   title: 'Har soatda',    desc: 'Narxlar yangilanadi' },
            { icon: ShieldCheck, title: 'Ishonchli',     desc: 'Tasdiqlangan do\'konlar' },
            { icon: TrendingUp,  title: 'Eng arzon',     desc: 'Kafolatlangan narx' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-[#0062FF]" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-black text-gray-900">{title}</p>
                <p className="text-xs text-gray-400 font-medium">{desc}</p>
              </div>
              <p className="sm:hidden text-xs font-black text-gray-700">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Market logos ── */}
      <section className="mt-8 px-4 max-w-7xl mx-auto">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 text-center mb-5">
          Quyidagi do'konlardan narxlar olinadi
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {MARKET_LOGOS.map(({ name, color }) => (
            <div
              key={name}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-black text-gray-800">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trending products ── */}
      <section className="mt-10 md:mt-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h2 className="font-black text-gray-900 text-xl md:text-2xl tracking-tight">
              {t.landing.trending.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Bir mahsulot — bir nechta do'kon narxi
            </p>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-sm font-bold text-[#0062FF] hover:underline"
          >
            {t.landing.trending.viewAll}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {isLoading && featuredProducts.length === 0
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : featuredProducts.map((product) => {
                const sortedMarkets = [...(product.markets || [])].sort((a, b) => a.price - b.price);
                const bestPrice = sortedMarkets[0]?.price ?? product.price;

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col"
                  >
                    {/* image */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'}
                        alt={product.name}
                        className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                      />
                      {sortedMarkets.length > 1 && (
                        <div className="absolute top-3 left-3 bg-[#0062FF] text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                          {sortedMarkets.length} do'kon
                        </div>
                      )}
                    </div>

                    {/* info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-black text-gray-700">{product.rating}</span>
                        <span className="text-[10px] text-gray-400">({product.reviews})</span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-3 flex-1">
                        {product.name}
                      </h3>

                      {/* inline market prices */}
                      {sortedMarkets.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {sortedMarkets.slice(0, 2).map((m, idx) => (
                            <div key={m.source} className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${idx === 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${idx === 0 ? 'text-green-700' : 'text-gray-500'}`}>
                                {idx === 0 ? '✓ ' : ''}{m.source}
                              </span>
                              <span className={`text-xs font-black ${idx === 0 ? 'text-green-700' : 'text-gray-500'}`}>
                                {formatSum(m.price)}
                              </span>
                            </div>
                          ))}
                          {sortedMarkets.length > 2 && (
                            <p className="text-[10px] text-[#0062FF] font-bold text-right px-1">
                              +{sortedMarkets.length - 2} ta boshqa narx →
                            </p>
                          )}
                        </div>
                      )}

                      <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Eng arzon</p>
                          <p className="text-base font-black text-gray-900">{formatSum(bestPrice)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-[#0062FF] transition-colors">
                          <ArrowRight className="w-4 h-4 text-[#0062FF] group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-14 md:mt-24 px-4 pb-10 max-w-7xl mx-auto">
        <h2 className="font-black text-gray-900 text-xl md:text-2xl mb-8 text-center tracking-tight">
          {t.landing.howItWorks.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {t.landing.howItWorks.steps.map((item, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#0062FF] text-white flex items-center justify-center font-black text-lg mb-4 shadow-lg shadow-blue-500/20">
                {idx + 1}
              </div>
              <h3 className="font-black text-gray-900 text-base mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              {idx < 2 && (
                <div className="hidden md:block absolute top-10 -right-4 z-10 text-gray-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 pb-10 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#0062FF] to-[#1E3A8A] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
          </div>
          <div className="relative z-10">
            <Smartphone className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h2 className="text-white font-black text-2xl md:text-3xl mb-3 tracking-tight">
              Eng yaxshi narxni hoziroq toping
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-7 max-w-md mx-auto">
              {total > 0 ? `${total.toLocaleString()} ta mahsulot` : '500+ mahsulot'} — 6 ta do'kon — real vaqt narxlari
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-[#0062FF] font-black rounded-2xl px-8 py-4 text-base shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Barcha mahsulotlarni ko'rish
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
