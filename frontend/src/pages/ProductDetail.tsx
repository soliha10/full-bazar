import { useMemo } from "react";
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
import { ProductHeading } from "./detail/ProductHeading";
import { KeySpecs } from "./detail/KeySpecs";
import { PriceSummary } from "./detail/PriceSummary";
import { SectionNav } from "./detail/SectionNav";
import { OffersSection } from "./detail/OffersSection";
import { SpecsSection } from "./detail/SpecsSection";
import { PriceHistoryChart } from "./detail/PriceHistoryChart";
import { StoreComparison } from "./detail/StoreComparison";
import { useColorVariant } from "./detail/useColorVariant";
import { ColorPicker } from "./detail/ColorPicker";
import { SavedProducts, SimilarProducts } from "./detail/ProductRails";

/**
 * Mahsulot sahifasi — narx solishtirish saytlari (Idealo, PriceRunner, Geizhals)
 * tartibida: tepada rasm + xulosa (narx, holat, eng arzon do'kon tugmasi),
 * so'ng yopishqoq bo'limlar menyusi va to'liq kenglikdagi bo'limlar:
 * takliflar → narx tarixi → xususiyatlar → o'xshash modellar.
 */
export function ProductDetail() {
  const { t } = useLanguage();
  const d = t.detailPage;
  const { favorites, toggle, isLiked } = useFavorites();
  const { compareIds, toggleCompare } = useCompare();
  // Tartib muhim: avval ma'lumot effektlari, keyin galereya kuzatuvchisi.
  const { navigate, product, loading, error, priceHistory, similarProducts, similarLoading, specs } = useProductDetail();
  // Tanlangan rang: galereya, narx va takliflar faqat shu rangga tegishli
  const variant = useColorVariant(product);
  const view = variant.view;
  const gallery = useImageGallery(view);

  const stats = computePriceStats(view, 0, priceHistory ?? []);
  const liked = product ? isLiked(product.id) : false;
  const inCompare = product ? compareIds.includes(String(product.id)) : false;
  const showSimilar = similarLoading || similarProducts.length > 0;
  const sections = useMemo(() => [
    { id: 'offers', label: d.navOffers },
    { id: 'history', label: d.priceHistoryTitle },
    { id: 'specs', label: d.navSpecs },
    ...(showSimilar ? [{ id: 'similar', label: d.similarProducts }] : []),
  ], [d, showSimilar]);

  if (loading) return <DetailLoading />;
  if (error || !product) return <DetailError error={error} onBack={() => navigate('/products')} />;

  const toggleLike = () => toggle(product);

  return (
    <div className="min-h-screen pb-32 md:pb-12 transition-colors">
      <DetailSeo product={product} />
      <MobileTopBar product={product} liked={liked} onBack={() => navigate(-1)} onToggleLike={toggleLike} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-6 overflow-hidden">
          <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0">{t.nav.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0 capitalize">
            {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
        </nav>

        <motion.div className="grid lg:grid-cols-12 gap-6 lg:gap-10"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <div className="lg:col-span-5">
            <ImageGallery gallery={gallery} productName={product.name} />
          </div>
          <div className="lg:col-span-7 space-y-5">
            <ProductHeading product={product} liked={liked} inCompare={inCompare}
              onToggleLike={toggleLike} onToggleCompare={() => toggleCompare(String(product.id))} />
            <KeySpecs specs={specs} />
            <ColorPicker variants={variant.variants} active={variant.active} cheapest={variant.cheapest} onSelect={variant.select} />
            <PriceSummary product={view ?? product} stats={stats} history={priceHistory} />
          </div>
        </motion.div>

        <SectionNav items={sections} />

        <div className="mt-6 space-y-10">
          <OffersSection product={view ?? product} stats={stats} />
          <div id="history" className="scroll-mt-32">
            <PriceHistoryChart history={priceHistory} markets={product.markets ?? []} />
            <StoreComparison history={priceHistory} markets={product.markets ?? []} />
          </div>
          <SpecsSection specs={specs} />
        </div>
      </div>

      {showSimilar && <SimilarProducts loading={similarLoading} products={similarProducts} bestPrice={stats.bestPrice} />}
      {favorites.length > 0 && <SavedProducts favorites={favorites} onToggle={toggle} />}

      <MobileBuyBar product={view ?? product} selectedMarket={stats.sortedMarkets[0]} />
    </div>
  );
}
