import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Heart,
  Share2,
  ChevronLeft,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Store,
  TrendingDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "../components/Button";
import { fetchProductById, fetchPersonalizedRecommendations, fetchPriceHistory } from "../services/api";
import { mapProduct, formatSum } from "../utils/productMapper";
import { Product } from "../components/ProductCard";
import { useLanguage } from "../contexts/LanguageContext";
import { trackEvent } from "../services/tracking";
import { useFavorites } from "../hooks/useFavorites";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'priceHistory'>('overview');
  const [priceHistory, setPriceHistory] = useState<{ date: string; source: string; price: number }[]>([]);
  const { favorites, toggle, isLiked } = useFavorites();
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const getProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        const mapped = mapProduct(data);
        setProduct(mapped);
        trackEvent('view', id);
        if (mapped.markets && mapped.markets.length > 0) {
          const sorted = [...mapped.markets].sort((a, b) => a.price - b.price);
          const cheapest = sorted[0];
          const index = mapped.markets.findIndex(
            (m) => m.source === cheapest.source && m.price === cheapest.price
          );
          setSelectedMarketIndex(index !== -1 ? index : 0);
        }
      } catch {
        setError(t.detail.productNotFound);
      } finally {
        setLoading(false);
      }
    };
    getProduct();
  }, [id]);

  useEffect(() => {
    fetchPersonalizedRecommendations(6)
      .then((data) => setSimilarProducts((data.products ?? []).map(mapProduct)))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPriceHistory(id, 30).then((data) => setPriceHistory(data.history ?? []));
    }
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images && product.images.length > 0
      ? product.images.filter((img) => img && img !== "")
      : [product.image];
  }, [product]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = imageRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setSelectedImage(idx);
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.5 },
    );
    imageRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [images]);

  const goToImage = (idx: number) => {
    const total = images.length;
    const next = ((idx % total) + total) % total;
    setSelectedImage(next);
    const el = imageRefs.current[next];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const selectedMarket = product?.markets?.[selectedMarketIndex];
  const sortedMarkets = product?.markets ? [...product.markets].sort((a, b) => a.price - b.price) : [];
  const bestPrice = sortedMarkets[0]?.price ?? product?.price ?? 0;
  const worstPrice = sortedMarkets[sortedMarkets.length - 1]?.price;
  const savings = worstPrice && worstPrice > bestPrice ? worstPrice - bestPrice : 0;
  const liked = product ? isLiked(product.id) : false;

  const historyChartData = (() => {
    const sources = [...new Set(priceHistory.map(h => h.source))];
    const byDate: Record<string, Record<string, number>> = {};
    priceHistory.forEach(h => {
      const d = h.date.slice(0, 10);
      if (!byDate[d]) byDate[d] = {};
      byDate[d][h.source] = h.price;
    });
    const data = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
    return { data, sources };
  })();
  const HISTORY_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">{t.detail.analyzingPrices}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 text-center shadow-xl border border-gray-100 dark:border-gray-800 max-w-sm w-full">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">{error || t.detail.productNotFound}</h2>
          <Button variant="primary" onClick={() => navigate('/products')} className="rounded-2xl px-10">
            {t.detail.backToMarketplace}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 md:pb-12 transition-colors">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
          {t.detail.productDetails}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => product && toggle(product)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all"
          >
            <Heart className={`w-4.5 h-4.5 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
          </button>
          <button
            onClick={() => navigator.share?.({ title: product?.name, url: window.location.href })}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all"
          >
            <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumbs — desktop */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-8 overflow-hidden">
          <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0">{t.nav.home}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link to={`/products?category=${product.category}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0 capitalize">
            {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* ── Left: Image ── */}
          <motion.div
            className="lg:w-1/2 space-y-4"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* Best seller badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-amber-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {t.detail.bestSeller}
                </span>
              </div>

              {/* Savings badge */}
              {savings > 0 && (
                <div className="absolute top-4 right-14 md:right-4 z-10">
                  <span className="flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm">
                    <TrendingDown className="w-3 h-3" />
                    -{formatSum(savings)}
                  </span>
                </div>
              )}

              {/* Like on image (mobile overlay) */}
              <div className="md:hidden absolute top-4 right-4 z-10">
                <button
                  onClick={() => product && toggle(product)}
                  className="w-9 h-9 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"
                >
                  <Heart className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </button>
              </div>

              {/* Image carousel */}
              <div
                ref={scrollContainerRef}
                className="flex md:block overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    ref={el => { imageRefs.current[idx] = el; }}
                    className="min-w-full md:min-w-0 snap-center"
                  >
                    <img
                      src={img}
                      alt={product.name}
                      className={`w-full aspect-square object-contain p-8 md:p-12 transition-opacity duration-500 ${
                        selectedImage === idx ? 'opacity-100' : 'md:hidden'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Carousel arrows (shown when more than 3 images) */}
              {images.length > 3 && (
                <>
                  <button
                    onClick={() => goToImage(selectedImage - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md hover:bg-white dark:hover:bg-gray-800 active:scale-90 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => goToImage(selectedImage + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md hover:bg-white dark:hover:bg-gray-800 active:scale-90 transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </>
              )}

              {/* Dot indicators (mobile) */}
              {images.length > 1 && (
                <div className="md:hidden flex justify-center gap-1.5 pb-5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`rounded-full transition-all duration-300 ${
                        selectedImage === idx
                          ? 'w-5 h-1.5 bg-violet-600'
                          : 'w-1.5 h-1.5 bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails — desktop */}
            <div className="hidden md:grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-2 border-2 transition-all aspect-square ${
                    selectedImage === idx
                      ? "border-violet-600 shadow-md shadow-violet-500/10"
                      : "border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            {/* Market overview — desktop */}
            <div className="hidden md:block bg-violet-50/60 dark:bg-violet-900/10 rounded-3xl p-7 border border-violet-100 dark:border-violet-900/30">
              <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 mb-5 uppercase tracking-widest flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-violet-500" />
                {t.detail.compareStores}
              </h3>
              <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                {[
                  { label: t.detail.specLabels.marketsCount, value: `${product.markets?.length || 1} ta` },
                  { label: t.detail.specLabels.lowestPrice,  value: formatSum(bestPrice) },
                  { label: t.detail.specLabels.highestPrice, value: formatSum(sortedMarkets[sortedMarkets.length - 1]?.price ?? bestPrice) },
                  { label: t.detail.specLabels.bestStore,    value: product.source || '—' },
                ].map((spec, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{spec.label}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Right: Info ── */}
          <motion.div
            className="lg:w-1/2 space-y-5"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
          >
            {/* Title & meta */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-violet-600 dark:text-violet-400 font-black text-xs uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-full">
                  {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
                </span>
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t.detail.inStockReady}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <h1 className="flex-1 text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  {product.name}
                </h1>
                <button
                  onClick={() => product && toggle(product)}
                  className="hidden md:flex mt-1 w-11 h-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-red-300 dark:hover:border-red-800 active:scale-90 transition-all shadow-sm"
                >
                  <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-xl shadow-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-600"}`} />
                  ))}
                  <span className="ml-1.5 font-black text-gray-900 dark:text-white text-sm">{product.rating}</span>
                </div>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                  {product.reviews} {t.detail.customerReviewsLabel}
                </span>
              </div>
            </div>

            {/* Price section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-7 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              {/* Best price display */}
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                    {t.detail.bestPriceMarket}: <span className="text-violet-600 dark:text-violet-400">{selectedMarket?.source}</span>
                  </p>
                  {/* <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 shrink-0 text-center">
                    {t.detail.lowestPrice30Days}
                  </span> */}

                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">
                      {formatSum(selectedMarket?.price || product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-300 dark:text-gray-600 line-through decoration-2">
                        {formatSum(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
               
              </div>

              {/* Desktop price table */}
              <div className="hidden md:block overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase pb-3">{t.detail.marketplace}</th>
                      <th className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase pb-3">{t.detail.availability}</th>
                      <th className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase pb-3">{t.detail.price}</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {sortedMarkets.map((market, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.28, delay: idx * 0.06 }}
                        onClick={() => setSelectedMarketIndex(product.markets?.indexOf(market) ?? idx)}
                        className={`cursor-pointer transition-colors ${
                          selectedMarketIndex === product.markets?.indexOf(market)
                            ? 'bg-violet-50/50 dark:bg-violet-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <td className="py-3.5 font-bold text-gray-900 dark:text-white text-sm">{market.source}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.detail.inStock}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-black text-gray-900 dark:text-white text-sm">{formatSum(market.price)}</td>
                        <td className="py-3.5 text-right">
                          <a
                            href={market.url}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
                          >
                            {t.detail.goToShop} <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile market cards */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">{t.detail.compareStores}</h3>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    {product.markets?.length} {t.detail.storesAvailable}
                  </span>
                </div>
                {sortedMarkets.slice(0, 4).map((market, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      idx === 0
                        ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/50'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        idx === 0
                          ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {market.source.substring(0, 1)}
                      </div>
                      <div>
                        <span className={`font-bold text-sm block ${idx === 0 ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                          {market.source}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {t.landing.hero.cheapest}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`font-black text-sm ${idx === 0 ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                        {formatSum(market.price)}
                      </span>
                      <a
                        href={market.url}
                        target="_blank"
                        className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-3 py-1.5 rounded-xl text-[11px] font-bold min-h-[36px] active:bg-violet-600 active:text-white active:border-violet-600 transition-colors"
                      >
                        {t.detail.shop} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Smart Summary */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-7 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                  {t.detail.aiSmartSummary}
                </h3>
                <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-xl font-black text-sm">
                  4.8 / 5.0
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.detail.aiLabels.performance, value: "4.9", color: "bg-emerald-500" },
                  { label: t.detail.aiLabels.camera,      value: "4.7", color: "bg-violet-500" },
                  { label: t.detail.aiLabels.battery,     value: "4.8", color: "bg-amber-400" },
                  { label: t.detail.aiLabels.display,     value: "4.6", color: "bg-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span className="text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${item.color} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${parseFloat(item.value) * 20}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  {t.detail.quickSpecifications}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                  "Foydalanuvchilar tez ishlash tezligi va kamera sifatini yuqori baholaydi. Batareya bir kun davomida yetarli, ekran esa yorqin va aniq."
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Tabs / Bottom Section ── */}
        <div className="mt-10 md:mt-16">
          {/* Mobile tabs */}
          <div className="md:hidden bg-white dark:bg-gray-900 rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-sm mb-6 flex">
            {(['overview', 'specs', 'reviews', 'priceHistory'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-1 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'overview' ? t.detail.overview
                  : tab === 'specs' ? t.detail.specs
                  : tab === 'reviews' ? t.detail.reviewsTab
                  : 'Narx tarixi'}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">
            {/* Main content */}
            <div className={`lg:col-span-2 space-y-8 ${activeTab !== 'overview' && 'hidden md:block'}`}>
              <section id="overview" className="space-y-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-1 h-6 bg-violet-600 rounded-full" />
                  {t.detail.productStory}
                </h2>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {product.description || t.detail.productStoryFallback}
                </p>
              </section>

              <section
                id="specs"
                className={`${activeTab !== 'specs' && 'hidden md:block'} space-y-6 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm`}
              >
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t.detail.mainSpecifications}</h2>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest border-b border-violet-100 dark:border-violet-900/30 pb-2">
                      {t.detail.compareStores}
                    </h3>
                    <div className="space-y-3">
                      {sortedMarkets.slice(0, 4).map((market, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-gray-400 dark:text-gray-500">{market.source}</span>
                          <span className="font-black text-gray-900 dark:text-white">{formatSum(market.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest border-b border-violet-100 dark:border-violet-900/30 pb-2">
                      {t.detail.insideBox}
                    </h3>
                    <ul className="space-y-2.5">
                      {[
                        t.detail.boxItems.primaryProduct,
                        t.detail.boxItems.quickStartGuide,
                        t.detail.boxItems.usbCable,
                        t.detail.boxItems.travelCase,
                        t.detail.boxItems.warrantyCard,
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            {/* Reviews sidebar */}
            <div className={`space-y-6 ${activeTab !== 'reviews' && 'hidden lg:block'}`}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-base font-black text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                  {t.detail.mostHelpfulReviews}
                </h2>
                <div className="space-y-6">
                  {[
                    { user: "Akbar T.",  rating: 5, days: 2,   comment: "Narxni bir nechta do'kon bilan solishtirib, eng arzonidan oldim. Telefon sifati a'lo!" },
                    { user: "Malika R.", rating: 4, weeks: 1,  comment: "Kamera sifati zo'r, batareya ham yaxshi ishlayapti. Narx/sifat nisbati yaxshi." },
                    { user: "Jasur K.",  rating: 5, weeks: 2,  comment: "Bu yil eng yaxshi xaridim. Tez va ishonchli, narxini bu yerda topdim!" },
                  ].map((review, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            ['bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300',
                             'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
                             'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'][i]
                          }`}>
                            {review.user[0]}
                          </div>
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{review.user}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className={`w-3 h-3 ${s < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">"{review.comment}"</p>
                      <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase">
                        {review.days ? `${review.days} ${t.detail.timeAgo.daysAgo}` : `${(review as any).weeks} ${t.detail.timeAgo.weeksAgo}`}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  {t.detail.viewMoreReviews}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Price History Chart ── */}
        <div className={`${activeTab !== 'priceHistory' && 'hidden lg:block'} mt-10`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-1 h-6 bg-violet-600 rounded-full" />
                Narx tarixi (so'nggi 30 kun)
              </h2>
              {priceHistory.length === 0 && (
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  Ma'lumot to'planmoqda...
                </span>
              )}
            </div>

            {priceHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <TrendingDown className="w-7 h-7 text-violet-400" />
                </div>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 text-center max-w-xs">
                  Hali narx tarixi yo'q. Har kungi sinxronizatsiyadan keyin narxlar saqlanib boradi.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyChartData.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    tickFormatter={v => String(v).slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    tickFormatter={v => `${(Number(v) / 1_000_000).toFixed(1)}M`}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v, name) => [formatSum(Number(v)), String(name)]}
                    labelFormatter={l => `Sana: ${l}`}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontWeight: 700, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                  {historyChartData.sources.map((src, i) => (
                    <Line
                      key={src}
                      type="monotone"
                      dataKey={src}
                      stroke={HISTORY_COLORS[i % HISTORY_COLORS.length]}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Saved (liked) products ── */}
      {favorites.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              Saqlangan mahsulotlar
            </h2>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              {favorites.length} ta
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {favorites.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <div className="relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full aspect-square object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-2 mb-2"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+image'; }}
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); toggle(p); }}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                  >
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  </button>
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-white line-clamp-2 mb-1 leading-snug">{p.name}</p>
                <p className="text-xs font-black text-violet-600 dark:text-violet-400">{formatSum(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Similar products ── */}
      {similarProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 mt-8">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            O'xshash mahsulotlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {similarProducts.slice(0, 10).map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full aspect-square object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-2 mb-2"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+image'; }}
                />
                <p className="text-xs font-bold text-gray-800 dark:text-white line-clamp-2 mb-1 leading-snug">{p.name}</p>
                <p className="text-xs font-black text-violet-600 dark:text-violet-400">{formatSum(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar (mobile) ── */}
      <div
        className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white/97 dark:bg-gray-900/97 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-4 py-3 z-40 flex items-center gap-4"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      >
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">
            {t.detail.fromPrice}
          </span>
          <span className="text-xl font-black text-violet-600 dark:text-violet-400 leading-none">
            {formatSum(selectedMarket?.price || product.price)}
          </span>
        </div>
        <a
          href={selectedMarket?.url}
          target="_blank"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-7 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-violet-500/25 active:scale-95 transition-all whitespace-nowrap"
        >
          {t.detail.goToShop}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
