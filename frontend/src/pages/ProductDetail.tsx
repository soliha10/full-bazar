import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Heart,
  Share2,
  ChevronLeft,
  Loader2,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { Button } from "../components/Button";
import { fetchProductById } from "../services/api";
import { mapProduct, formatSum } from "../utils/productMapper";
import { Product } from "../components/ProductCard";
import { useLanguage } from "../contexts/LanguageContext";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const getProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        const mapped = mapProduct(data);
        setProduct(mapped);
        if (mapped.markets && mapped.markets.length > 0) {
          const sorted = [...mapped.markets].sort((a, b) => a.price - b.price);
          const cheapest = sorted[0];
          const index = mapped.markets.findIndex(
            (m) => m.source === cheapest.source && m.price === cheapest.price
          );
          setSelectedMarketIndex(index !== -1 ? index : 0);
        }
      } catch (err) {
        setError(t.detail.productNotFound);
      } finally {
        setLoading(false);
      }
    };
    getProduct();
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

  const selectedMarket = product?.markets?.[selectedMarketIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0062FF] animate-spin mb-4" />
        <p className="text-gray-500 font-bold animate-pulse">{t.detail.analyzingPrices}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] p-12 text-center shadow-xl border border-gray-100 max-w-lg w-full">
          <h2 className="text-3xl font-black text-gray-900 mb-6">{error || t.detail.productNotFound}</h2>
          <Button variant="primary" onClick={() => navigate('/products')} className="rounded-2xl px-12">
            {t.detail.backToMarketplace}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 md:pb-12">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <span className="font-bold text-gray-900 truncate max-w-[200px]">{t.detail.productDetails}</span>
        <button className="p-1"><Share2 className="w-5 h-5 text-gray-400" /></button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumbs - Desktop Only */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-400 mb-8 overflow-hidden">
          <Link to="/" className="hover:text-gray-600 shrink-0">{t.nav.home}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link to={`/products?category=${product.category}`} className="hover:text-gray-600 shrink-0">{product.category}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column: Visuals */}
          <div className="lg:w-1/2 space-y-6">
            <div className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group">
              {/* Product Badge */}
              <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                <span className="bg-[#FFC107] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {t.detail.bestSeller}
                </span>
              </div>

              {/* Mobile Carousel / Carousel Wrapper */}
              <div 
                ref={scrollContainerRef}
                className="flex md:block overflow-x-auto snap-x snap-mandatory hide-scrollbar"
              >
                {/* Heart Icon for Mobile */}
                <div className="md:hidden absolute top-4 right-4 z-10">
                  <button className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Heart className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                {images.map((img, idx) => (
                  <div key={idx} className="min-w-full md:min-w-0 snap-center">
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

              {/* Carousel Indicators (Mobile) */}
              <div className="md:hidden flex justify-center gap-2 pb-6">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all ${selectedImage === idx ? 'w-6 bg-[#0062FF]' : 'w-1.5 bg-gray-200'}`} 
                  />
                ))}
              </div>
            </div>

            {/* Desktop Thumbnails */}
            <div className="hidden md:grid grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`bg-white rounded-2xl p-2 border-2 transition-all aspect-square shrink-0 ${
                    selectedImage === idx ? "border-[#0062FF]" : "border-gray-50 hover:border-gray-200"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            {/* Market Overview - Desktop Only */}
            <div className="hidden md:block bg-blue-50/50 rounded-4xl p-8 border border-blue-100">
              <h3 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0062FF]" />
                {t.detail.compareStores}
              </h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                {[
                  { label: t.detail.specLabels.marketsCount, value: `${product.markets?.length || 1} ta` },
                  { label: t.detail.specLabels.lowestPrice, value: formatSum(product.price) },
                  { label: t.detail.specLabels.highestPrice, value: formatSum(product.markets?.[Math.max(0, (product.markets?.length ?? 1) - 1)]?.price ?? product.price) },
                  { label: t.detail.specLabels.bestStore, value: product.source || '—' }
                ].map((spec, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{spec.label}</p>
                    <p className="font-bold text-gray-900">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[#0062FF] font-black text-xs uppercase tracking-widest">{product.category}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="text-emerald-500 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {t.detail.inStockReady}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-[#FFC107] text-[#FFC107]" : "text-gray-200"}`} />
                  ))}
                  <span className="ml-2 font-black text-gray-900">{product.rating}</span>
                </div>
                <button className="text-xs font-bold text-gray-400 hover:text-gray-600 underline underline-offset-4 decoration-gray-200">
                  {product.reviews} {t.detail.customerReviewsLabel}
                </button>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.detail.bestPriceMarket}: {selectedMarket?.source}</p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-4xl md:text-5xl font-black text-[#0062FF] tracking-tighter">
                      {formatSum(selectedMarket?.price || product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xl md:text-2xl text-gray-300 line-through decoration-gray-200 decoration-2 italic">
                        {formatSum(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end">
                   <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 mb-2">
                     {t.detail.lowestPrice30Days}
                   </span>
                   <p className="text-[10px] font-bold text-gray-400">{t.detail.pricesRealTime}</p>
                </div>
              </div>

              {/* Desktop Comparison Table */}
              <div className="hidden md:block overflow-hidden pt-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="text-[10px] font-black text-gray-400 uppercase pb-4">{t.detail.marketplace}</th>
                      <th className="text-[10px] font-black text-gray-400 uppercase pb-4">{t.detail.availability}</th>
                      <th className="text-[10px] font-black text-gray-400 uppercase pb-4">{t.detail.price}</th>
                      <th className="text-right pb-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {product.markets?.sort((a,b) => a.price - b.price).map((market, idx) => (
                      <tr key={idx} className={`group cursor-pointer ${selectedMarketIndex === product.markets?.indexOf(market) ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                        <td className="py-4 font-bold text-gray-900">{market.source}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-gray-600 italic">{t.detail.inStock}</span>
                          </div>
                        </td>
                        <td className="py-4 font-black text-gray-900">{formatSum(market.price)}</td>
                        <td className="py-4 text-right">
                          <a 
                            href={market.url} 
                            target="_blank" 
                            className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-xl text-xs font-black shadow-sm group-hover:bg-[#0062FF] group-hover:text-white group-hover:border-[#0062FF] transition-all"
                          >
                           {t.detail.goToShop}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Market List - Updated with Buttons */}
              <div className="md:hidden space-y-4">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{t.detail.compareStores}</h3>
                    <button className="text-[10px] font-black text-[#0062FF] uppercase underline underline-offset-4">
                      {product.markets?.length} {t.detail.storesAvailable}
                    </button>
                 </div>
                 {product.markets?.sort((a,b) => a.price - b.price).slice(0, 4).map((market, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-4xl border border-gray-100 shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-[#0062FF] text-xs">
                           {market.source.substring(0, 1)}
                        </div>
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-900 text-sm">{market.source}</span>
                           <div className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-[#FFC107] text-[#FFC107]" />
                              <span className="text-[10px] font-black text-gray-400">4.5</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="font-black text-gray-900 text-sm">{formatSum(market.price)}</span>
                        <a 
                          href={market.url} 
                          target="_blank"
                          className="bg-white border border-gray-200 text-gray-900 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 active:bg-[#0062FF] active:text-white transition-colors"
                        >
                          {t.detail.shop} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                     </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* AI Smart Summary */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0062FF]" />
                  {t.detail.aiSmartSummary}
                </h3>
                <div className="bg-blue-50 text-[#0062FF] px-3 py-1.5 rounded-xl font-black text-sm">
                  4.8 / 5.0
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t.detail.aiLabels.performance, value: "4.9", color: "bg-emerald-500" },
                  { label: t.detail.aiLabels.camera, value: "4.7", color: "bg-[#0062FF]" },
                  { label: t.detail.aiLabels.battery, value: "4.8", color: "bg-[#FFC107]" },
                  { label: t.detail.aiLabels.display, value: "4.6", color: "bg-purple-500" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span className="text-gray-900">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${parseFloat(item.value) * 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.detail.quickSpecifications}</h4>
                 <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                   "Foydalanuvchilar tez ishlash tezligi va kamera sifatini yuqori baholaydi. Batareya bir kun davomida yetarli, ekran esa yorqin va aniq. Bir nechta do'kondagi narxlarni solishtirish orqali eng yaxshi shartnomani topishingiz mumkin."
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs / Bottom Section */}
        <div className="mt-16">
          {/* Mobile Tabs */}
          <div className="md:hidden flex items-center justify-between gap-2 mb-8 bg-gray-100 p-1 rounded-2xl">
            {(['overview', 'specs', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                }`}
              >
                {tab === 'overview' ? t.detail.overview : tab === 'specs' ? t.detail.specs : t.detail.reviewsTab}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-16">
            <div className={`lg:col-span-2 space-y-16 ${activeTab !== 'overview' && 'hidden md:block'}`}>
               <section id="overview" className="space-y-6">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                   <div className="w-1.5 h-8 bg-[#0062FF] rounded-full" />
                   {t.detail.productStory}
                 </h2>
                 <p className="text-lg text-gray-500 font-medium leading-relaxed">
                   {product.description || t.detail.productStoryFallback}
                 </p>
               </section>

               <section id="specs" className={`${activeTab !== 'specs' && 'hidden md:block'} space-y-8 bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm`}>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t.detail.mainSpecifications}</h2>
                  <div className="grid sm:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-[#0062FF] uppercase tracking-widest border-b border-blue-100 pb-2">{t.detail.compareStores}</h3>
                      <div className="space-y-4">
                        {(product.markets ?? []).slice(0, 4).map((market, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-400 italic">{market.source}</span>
                            <span className="font-black text-gray-900">{formatSum(market.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-[#0062FF] uppercase tracking-widest border-b border-blue-100 pb-2">{t.detail.insideBox}</h3>
                      <ul className="grid grid-cols-1 gap-3">
                        {[t.detail.boxItems.primaryProduct, t.detail.boxItems.quickStartGuide, t.detail.boxItems.usbCable, t.detail.boxItems.travelCase, t.detail.boxItems.warrantyCard].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                             {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
               </section>
            </div>

            {/* Sidebar Column (Desktop) / Reviews (Mobile) */}
            <div className={`space-y-8 ${activeTab !== 'reviews' && 'hidden lg:block'}`}>
              <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                 <h2 className="text-xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">{t.detail.mostHelpfulReviews}</h2>
                 <div className="space-y-8">
                    {[
                      { user: "Akbar T.", rating: 5, days: 2, comment: "Narxni bir nechta do'kon bilan solishtirib, eng arzonidan oldim. Telefon sifati a'lo!", color: "bg-blue-100" },
                      { user: "Malika R.", rating: 4, weeks: 1, comment: "Kamera sifati zo'r, batareya ham yaxshi ishlayapti. Narx/sifat nisbati yaxshi.", color: "bg-emerald-100" },
                      { user: "Jasur K.", rating: 5, weeks: 2, comment: "Bu yil eng yaxshi xaridim. Tez va ishonchli, narxini bu yerda topdim!", color: "bg-purple-100" }
                    ].map((review, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 ${review.color} rounded-full flex items-center justify-center font-black text-xs text-gray-600`}>
                               {review.user[0]}
                             </div>
                             <span className="font-bold text-sm text-gray-900">{review.user}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, s) => <Star key={s} className={`w-2.5 h-2.5 ${s < review.rating ? 'fill-[#FFC107] text-[#FFC107]' : 'text-gray-200'}`} />)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">"{review.comment}"</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase">
                          {review.days ? `${review.days} ${t.detail.timeAgo.daysAgo}` : `${review.weeks} ${t.detail.timeAgo.weeksAgo}`}
                        </p>
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-10 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">
                   {t.detail.viewMoreReviews}
                 </button>
              </div>

              {/* Shipping Card */}
              <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200 overflow-hidden relative group">
                 <ShoppingBag className="absolute -right-4 -bottom-4 w-32 h-32 opacity-15 rotate-12 transition-transform group-hover:scale-110" />
                 <h3 className="text-lg font-black mb-2 italic">{t.detail.fastShipping}</h3>
                 <p className="text-sm font-bold text-white/90 mb-6">{t.detail.orderWithin}</p>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">{t.detail.logisticsReady}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 z-50 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.detail.fromPrice}</span>
          <span className="text-xl font-black text-[#0062FF]">{formatSum(selectedMarket?.price || product.price)}</span>
        </div>
          <a 
            href={selectedMarket?.url} 
            target="_blank" 
            className="bg-[#0062FF] text-white px-8 py-4 rounded-full font-black text-sm shadow-xl shadow-blue-500/20 flex items-center gap-3 active:scale-95 transition-all"
          >
            {t.detail.goToShop}
            <ArrowRight className="w-4 h-4" />
          </a>
      </div>
    </div>
  );
}
