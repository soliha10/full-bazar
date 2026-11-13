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
import { useColorVariant } from "./detail/useColorVariant";
import { ColorPicker } from "./detail/ColorPicker";
import { SavedProducts, SimilarProducts } from "./detail/ProductRails";

/**
 * Mahsulot sahifasi — narx solishtirish saytlari (Idealo, PriceRunner, Geizhals)
 * tartibida: tepada rasm + xulosa (narx, holat, eng arzon do'kon tugmasi),
 * uch ustun: rasm | nom, rang, xususiyatlar | narx kartasi + takliflar (har
 * do'konning 30 kunlik o'zgarishi bilan); ostida narx tarixi to'liq kenglikda.
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

        {/* Desktop: rasm | nom, ranglar, xususiyatlar | narx kartasi + takliflar.
            O'ng ustun qat'iy kenglikda — kontent ko'paysa ham ustunlar siljimaydi;
            uch ustunning pastki cheti bir xil (oxirgi karta qolgan joyni egallaydi).
            Uzun ro'yxatlar (ranglar, takliflar, miniatyuralar) yig'iladi yoki ichida
            aylantiriladi — qator cheksiz cho'zilmaydi.
            Mobil tartib DOM bo'yicha: rasm, nom/ranglar, narx/takliflar, xususiyatlar. */}
        <motion.div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr]"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <div className="lg:row-span-2 min-h-0">
            <ImageGallery gallery={gallery} productName={product.name} />
          </div>
          <div className="space-y-3 lg:col-start-2 lg:row-start-1">
            <ProductHeading product={product} liked={liked} inCompare={inCompare}
              onToggleLike={toggleLike} onToggleCompare={() => toggleCompare(String(product.id))} />
            <ColorPicker variants={variant.variants} active={variant.active} cheapest={variant.cheapest} onSelect={variant.select} />
          </div>
          <div className="flex flex-col gap-3 lg:col-start-3 lg:row-start-1 lg:row-span-2">
            <PriceSummary product={view ?? product} stats={stats} history={priceHistory} />
            <OffersSection product={view ?? product} stats={stats} />
          </div>
          <div className="lg:col-start-2 lg:row-start-2 flex flex-col">
            <SpecsSection specs={specs} />
          </div>
        </motion.div>

        <div className="mt-4"><PriceHistoryChart history={priceHistory} markets={product.markets ?? []} /></div>
      </div>

      {showSimilar && <SimilarProducts loading={similarLoading} products={similarProducts} bestPrice={stats.bestPrice} />}
      {favorites.length > 0 && <SavedProducts favorites={favorites} onToggle={toggle} />}

      <MobileBuyBar product={view ?? product} selectedMarket={stats.sortedMarkets[0]} />
    </div>
  );
}
