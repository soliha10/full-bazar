import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompare } from "../contexts/CompareContext";
import { useFavorites } from "../hooks/useFavorites";
import { useProductDetail } from "./detail/useProductDetail";
import { useImageGallery } from "./detail/useImageGallery";
import { computePriceStats } from "./detail/priceStats";
import { DetailSeo } from "./detail/DetailSeo";
import { DetailLoading, DetailError } from "./detail/StatusScreens";
import { MobileTopBar, MobileBuyBar } from "./detail/MobileBars";
import { ImageGallery } from "./detail/ImageGallery";
import { MarketOverview, PriceInsight } from "./detail/PriceCards";
import { ProductHeading } from "./detail/ProductHeading";
import { PriceSection } from "./detail/PriceSection";
import { DetailTabs } from "./detail/DetailTabs";
import { PriceHistoryChart } from "./detail/PriceHistoryChart";
import { StoreComparison } from "./detail/StoreComparison";
import { useColorVariant } from "./detail/useColorVariant";
import { ColorPicker } from "./detail/ColorPicker";
import { SavedProducts, SimilarProducts } from "./detail/ProductRails";
import type { DetailTab } from "./detail/SpecsSection";

export function ProductDetail() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const { favorites, toggle, isLiked } = useFavorites();
  const { compareIds, toggleCompare } = useCompare();
  // Tartib muhim: avval ma'lumot effektlari, keyin galereya kuzatuvchisi.
  const {
    navigate, product, loading, error, selectedMarketIndex, setSelectedMarketIndex,
    priceHistory, similarProducts, similarLoading, specs,
  } = useProductDetail();
  // Tanlangan rang: galereya, narx va takliflar faqat shu rangga tegishli
  const variant = useColorVariant(product);
  const view = variant.view;
  const gallery = useImageGallery(view);
  useEffect(() => { setSelectedMarketIndex(0); }, [variant.active, setSelectedMarketIndex]);

  const stats = computePriceStats(view, selectedMarketIndex, priceHistory ?? []);
  const { selectedMarket, sortedMarkets, bestPrice, savings } = stats;
  const liked = product ? isLiked(product.id) : false;
  const inCompare = product ? compareIds.includes(String(product.id)) : false;

  if (loading) {
    return <DetailLoading />;
  }

  if (error || !product) {
    return <DetailError error={error} onBack={() => navigate('/products')} />;
  }

  const toggleLike = () => product && toggle(product);

  return (
    <div className="min-h-screen pb-32 md:pb-12 transition-colors">
      <DetailSeo product={product} />

      {/* ── Mobile top bar ── */}
      <MobileTopBar product={product} liked={liked} onBack={() => navigate(-1)} onToggleLike={toggleLike} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumbs — desktop */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-8 overflow-hidden">
          <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0">{t.nav.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0 capitalize">
            {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
          </Link>
          <span aria-hidden="true">/</span>
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
            <ImageGallery gallery={gallery} productName={product.name} savings={savings}
              liked={liked} onToggleLike={toggleLike} />

            <MarketOverview product={view ?? product} stats={stats} />
          </motion.div>

          {/* ── Right: Info ── */}
          <motion.div
            className="lg:w-1/2 space-y-5"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
          >
            <ProductHeading product={product} liked={liked} inCompare={inCompare}
              onToggleLike={toggleLike} onToggleCompare={() => product && toggleCompare(String(product.id))} />

            <ColorPicker variants={variant.variants} active={variant.active} cheapest={variant.cheapest} onSelect={variant.select} />

            <PriceSection product={view ?? product} stats={stats}
              selectedMarketIndex={selectedMarketIndex} onSelectMarket={setSelectedMarketIndex}
              showAllMarkets={showAllMarkets} onToggleShowAll={() => setShowAllMarkets(v => !v)} />

            {sortedMarkets.length > 0 && <PriceInsight stats={stats} />}
          </motion.div>
        </div>

        <DetailTabs product={product} specs={specs}
          activeTab={activeTab} onTabChange={setActiveTab} />

        <PriceHistoryChart history={priceHistory} markets={product.markets ?? []} activeTab={activeTab} />

        {/* Narvon (kim qanchaga qimmat) va 30 kunlik o'zgarish (±) — desktopda doim, mobilda narx tarixi tabida */}
        <div className={activeTab !== 'priceHistory' ? 'hidden lg:block' : ''}>
          <StoreComparison history={priceHistory} markets={product.markets ?? []} />
        </div>
      </div>

      {favorites.length > 0 && <SavedProducts favorites={favorites} onToggle={toggle} />}

      {(similarLoading || similarProducts.length > 0) && (
        <SimilarProducts loading={similarLoading} products={similarProducts} bestPrice={bestPrice} />
      )}

      {/* ── Sticky bottom bar (mobile) ── */}
      <MobileBuyBar product={view ?? product} selectedMarket={selectedMarket} />
    </div>
  );
}
