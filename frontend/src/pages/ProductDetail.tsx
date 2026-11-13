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
import { PriceSummary } from "./detail/PriceSummary";
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
 * so'ng desktopda yonma-yon juftliklar: takliflar | xususiyatlar, narx tarixi |
 * do'konlardagi o'zgarish; mobilda ketma-ket. Bo'sh joy qolmasin — kam
 * kontentli blok ham butun qatorni egallamaydi.
 */
export function ProductDetail() {
  const { t } = useLanguage();
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

  if (loading) return <DetailLoading />;
  if (error || !product) return <DetailError error={error} onBack={() => navigate('/products')} />;

  const toggleLike = () => toggle(product);

  return (
    <div className="min-h-screen pb-32 md:pb-12 transition-colors">
      <DetailSeo product={product} />
      <MobileTopBar product={product} liked={liked} onBack={() => navigate(-1)} onToggleLike={toggleLike} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-5">
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4 overflow-hidden">
          <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0">{t.nav.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0 capitalize">
            {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
        </nav>

        <motion.div className="grid lg:grid-cols-12 gap-4 lg:gap-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <div className="lg:col-span-4">
            <ImageGallery gallery={gallery} productName={product.name} />
          </div>
          <div className="lg:col-span-8 space-y-3">
            <ProductHeading product={product} liked={liked} inCompare={inCompare}
              onToggleLike={toggleLike} onToggleCompare={() => toggleCompare(String(product.id))} />
            <ColorPicker variants={variant.variants} active={variant.active} cheapest={variant.cheapest} onSelect={variant.select} />
            <PriceSummary product={view ?? product} stats={stats} history={priceHistory} />
          </div>
        </motion.div>

        <div className="mt-4 grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7"><OffersSection product={view ?? product} stats={stats} /></div>
          <div className="lg:col-span-5"><SpecsSection specs={specs} /></div>
          {/* Do'konlarda o'zgarish bo'lmasa StoreComparison null — tarix butun qatorni oladi */}
          <div className="lg:col-span-12 flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:flex-1 min-w-0"><PriceHistoryChart history={priceHistory} markets={product.markets ?? []} /></div>
            <div className="w-full lg:w-[34%] shrink-0 empty:hidden"><StoreComparison history={priceHistory} markets={product.markets ?? []} /></div>
          </div>
        </div>
      </div>

      {showSimilar && <SimilarProducts loading={similarLoading} products={similarProducts} bestPrice={stats.bestPrice} />}
      {favorites.length > 0 && <SavedProducts favorites={favorites} onToggle={toggle} />}

      <MobileBuyBar product={view ?? product} selectedMarket={stats.sortedMarkets[0]} />
    </div>
  );
}
