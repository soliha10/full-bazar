import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO, SITE_URL } from '../components/SEO';
import { useListingFilters } from './listing/useListingFilters';
import { useInfiniteProducts } from './listing/useInfiniteProducts';
import { useFilterActions } from './listing/useFilterActions';
import { useListingEffects } from './listing/useListingEffects';
import { MobileHeader } from './listing/MobileHeader';
import { DesktopSidebar, DesktopToolbar } from './listing/DesktopControls';
import { ActiveFilterChips } from './listing/ActiveFilterChips';
import { ProductResults } from './listing/ProductResults';
import { MobileFilterSheet } from './listing/MobileFilterSheet';
import { PAGE_CONTAINER } from '../components/layout';

export function ProductListing() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Hooklar tartibi muhim: effektlar aynan shu ketma-ketlikda ishlaydi
  // (filtr holati → mahsulotlar/cheksiz aylantirish → sessiya va aylantirish).
  const f = useListingFilters();
  const { searchQuery, selectedBrand, selectedCategory, selectedMarketplaces, viewMode } = f;
  const { products: filteredProducts, isLoading, isFetchingNextPage, hasMore, total, status, refetch, sentinelRef } =
    useInfiniteProducts(f);
  const actions = useFilterActions(f);
  const { activeFilterCount, brandLabel } = actions;
  useListingEffects(f, isLoading, filteredProducts.length);

  // Matnlar lokal fayllardan: ilgari bu yerda faqat uz/ru tanlovi bor edi,
  // shuning uchun ingliz tilida sarlavha ruscha chiqardi.
  const seoTitle = useMemo(() => {
    let part = t.listing.seoCatalog;
    if (selectedBrand) {
      part = selectedBrand;
    } else if (selectedCategory && selectedCategory !== 'All') {
      part = selectedCategory === 'smartphones' ? t.listing.seoSmartphones : selectedCategory;
    }
    if (searchQuery) {
      part = t.listing.seoSearch.replace('{{query}}', searchQuery);
    }
    return `${part} - ${t.listing.seoSuffix}`;
  }, [selectedBrand, selectedCategory, searchQuery, t]);

  const seoDesc = useMemo(
    () => t.listing.seoDesc.replace('{{brand}}', selectedBrand || t.listing.seoDescDefaultBrand),
    [selectedBrand, t],
  );

  // Sahifadagi ko'rinadigan h1 — SEO sarlavhasidan qisqaroq va tabiiyroq
  const pageHeading = useMemo(() => {
    if (searchQuery) return t.listing.headingSearch.replace('{{query}}', searchQuery);
    if (selectedBrand) return t.listing.headingBrand.replace('{{brand}}', brandLabel(selectedBrand));
    return t.listing.headingDefault;
  }, [searchQuery, selectedBrand, brandLabel, t]);

  return (
    <div className="min-h-screen">
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords={`smartfonlar, ${selectedBrand || ''}, telefonlar, telefon narxi, bazarcom, asaxiy, texnomart, olcha`}
        locale={language}
        // Qidiruv va filtr kombinatsiyalari cheksiz URL hosil qiladi — ularni
        // indeksdan chiqarib, kanonikni toza /products ga yo'naltiramiz.
        noindex={Boolean(searchQuery) || activeFilterCount > 0}
        canonicalUrl={`${SITE_URL}/products`}
        breadcrumbs={[
          { name: t.nav.home, url: '/' },
          { name: t.listing.seoSmartphones, url: '/products' },
        ]}
      />

      {/* ── Mobile sticky header ── */}
      <MobileHeader f={f} actions={actions} onBack={() => navigate(-1)} />

      {/* ── Main content ── */}
      <div className={`${PAGE_CONTAINER} py-4 pb-24 md:pb-8`}>

        {/* Breadcrumb — desktop */}
        <nav className="mb-4 hidden items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500 md:flex">
          <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {searchQuery ? t.listing.resultsFor.replace('{{query}}', searchQuery) : t.listing.products}
          </span>
        </nav>

        {/* Sahifa ustunlari (layout.ts): filtr paneli — bitta ustun, mahsulotlar —
            qolgani; shu tufayli karta bosh sahifadagi bilan bir xil o'lchamda */}
        <div className="lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4">

          {/* ── Sidebar (desktop) ── */}
          <DesktopSidebar f={f} actions={actions} />

          {/* ── Products ── */}
          <div className="min-w-0 lg:col-span-3 xl:col-span-4">

            {/* Sahifaning yagona h1 i. Mobil ko'rinishda tepadagi qidiruv
                paneli sarlavha vazifasini bajaradi, shuning uchun u yerda
                faqat skrin-riderlar uchun qoladi. */}
            <h1 className="sr-only md:not-sr-only md:mb-3 md:text-2xl md:font-semibold md:tracking-tight md:text-gray-900 md:dark:text-white">
              {pageHeading}
            </h1>

            {/* Desktop toolbar */}
            <DesktopToolbar f={f} total={total} showCount={!(isLoading || status === 'error')} />

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="hidden md:flex flex-wrap gap-1.5 mb-4">
                <ActiveFilterChips f={f} actions={actions} variant="desktop" />
              </div>
            )}

            <ProductResults
              products={filteredProducts}
              isLoading={isLoading}
              isError={status === 'error'}
              isFetchingNextPage={isFetchingNextPage}
              hasMore={hasMore}
              total={total}
              refetch={refetch}
              sentinelRef={sentinelRef}
              viewMode={viewMode}
              selectedMarketplaces={selectedMarketplaces}
              searchQuery={searchQuery}
              activeFilterCount={activeFilterCount}
              onClearSearch={actions.clearSearch}
              onResetFilters={actions.handleResetFilters}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile filter bottom sheet ── */}
      <MobileFilterSheet f={f} actions={actions} />
    </div>
  );
}
