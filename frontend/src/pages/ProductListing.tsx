import { useEffect, useMemo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import { formatSum } from '../utils/productMapper';

export function ProductListing() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Hooklar tartibi muhim: effektlar aynan shu ketma-ketlikda ishlaydi
  // (filtr holati → mahsulotlar/cheksiz aylantirish → sessiya va aylantirish).
  const f = useListingFilters();
  const { searchQuery, selectedBrand, selectedCategory, selectedMarketplaces, viewMode, brandRoute, brandFacets } = f;
  const { products: filteredProducts, isLoading, isFetchingNextPage, hasMore, total, status, refetch, sentinelRef } =
    useInfiniteProducts(f);
  const actions = useFilterActions(f);
  const { activeFilterCount, brandLabel } = actions;
  useListingEffects(f, isLoading, filteredProducts.length);
  const location = useLocation();

  // Brend sahifasida (/brand/:brand) foydalanuvchi brend filtrini o'zgartirsa —
  // manzil ham: boshqa brend tanlansa uning sahifasi, olib tashlansa — katalog.
  // Manzilning o'zi o'zgargan renderda (havola bosildi) filtr manzilga ergashadi
  // (useListingFilters), bu yerda qaytarib yuborilmaydi — aks holda eski brendga qaytardi.
  const prevRoute = useRef(brandRoute);
  useEffect(() => {
    const routeChanged = prevRoute.current !== brandRoute;
    prevRoute.current = brandRoute;
    if (!brandRoute || routeChanged || selectedBrand === brandRoute) return;
    navigate((selectedBrand ? `/brand/${selectedBrand}` : '/products') + location.search, { replace: true });
  }, [brandRoute, selectedBrand, navigate, location.search]);

  // Brend sahifasi: faqat brend filtri, qidiruvsiz — indekslanadi, kanonik /brand/<kalit>
  const isBrandPage = Boolean(brandRoute) && selectedBrand === brandRoute && !searchQuery;
  const brandFacet = isBrandPage ? brandFacets.find(b => b.key === brandRoute) : undefined;

  // Matnlar lokal fayllardan: ilgari bu yerda faqat uz/ru tanlovi bor edi,
  // shuning uchun ingliz tilida sarlavha ruscha chiqardi.
  const seoTitle = useMemo(() => {
    if (isBrandPage && brandRoute) {
      return t.listing.seoBrandTitle.replace('{{brand}}', brandLabel(brandRoute))
        .replace('{{count}}', String(total || brandFacet?.count || ''));
    }
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
  }, [selectedBrand, selectedCategory, searchQuery, isBrandPage, brandRoute, brandFacet, total, brandLabel, t]);

  const seoDesc = useMemo(() => {
    if (isBrandPage && brandRoute) {
      const from = brandFacet?.min_price ? t.listing.seoBrandFrom.replace('{{price}}', formatSum(brandFacet.min_price)) : '';
      return t.listing.seoBrandDesc.replace('{{brand}}', brandLabel(brandRoute))
        .replace('{{count}}', String(total || brandFacet?.count || '')).replace('{{from}}', from);
    }
    return t.listing.seoDesc.replace('{{brand}}', selectedBrand || t.listing.seoDescDefaultBrand);
  }, [selectedBrand, isBrandPage, brandRoute, brandFacet, total, brandLabel, t]);

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
        // Brend sahifasida brend filtrining o'zi hisobga olinmaydi.
        noindex={Boolean(searchQuery) || activeFilterCount > (isBrandPage ? 1 : 0)}
        canonicalUrl={isBrandPage ? `${SITE_URL}/brand/${brandRoute}` : `${SITE_URL}/products`}
        breadcrumbs={[
          { name: t.nav.home, url: '/' },
          { name: t.listing.seoSmartphones, url: '/products' },
          ...(isBrandPage && brandRoute ? [{ name: brandLabel(brandRoute), url: `/brand/${brandRoute}` }] : []),
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
          {isBrandPage && brandRoute ? (
            <>
              <Link to="/products" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{t.listing.products}</Link>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{brandLabel(brandRoute)}</span>
            </>
          ) : (
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {searchQuery ? t.listing.resultsFor.replace('{{query}}', searchQuery) : t.listing.products}
            </span>
          )}
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
