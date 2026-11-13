import { useLanguage } from '../contexts/LanguageContext';
import { SEO, SITE_URL } from '../components/SEO';
import { useTrendsData } from './trends/useTrendsData';
import { StatCards } from './trends/StatCards';
import { StoresBoard } from './trends/Charts';
import { SearchTrendsSection, PriceChanges } from './trends/Lists';
import { PopularSection } from './trends/PopularSection';

export function Trends() {
  const { t, language } = useLanguage();
  const {
    searchTrends, markets, popular, dropping, rising,
    weeklyEvents, totalProducts, totalMarkets, loading, failedSections,
  } = useTrendsData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const seoTitle = t.trends.seoTitle;
  const seoDesc = t.trends.seoDesc;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords="smartfon trendlari, telefon narxlari tushishi, bazarcom tahlil, o'zbekiston telefon bozori"
        locale={language}
        canonicalUrl={`${SITE_URL}/trends`}
        breadcrumbs={[
          { name: t.nav.home, url: '/' },
          { name: t.trends.breadcrumb, url: '/trends' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.trends.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.trends.subtitle}
        </p>
      </div>

      {/* Qism yuklanmasa — jimgina bo'sh qoldirmaymiz */}
      {failedSections.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {t.trends.partialError}
          </p>
          <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
            {failedSections.join(', ')}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <StatCards totalProducts={totalProducts} totalMarkets={totalMarkets}
        weeklyEvents={weeklyEvents} droppingCount={dropping.length} />

      {/* Search trends */}
      <SearchTrendsSection searchTrends={searchTrends} />

      <StoresBoard markets={markets} />

      {/* Price changes */}
      <PriceChanges dropping={dropping} rising={rising} />

      {/* Popular products */}
      <PopularSection popular={popular} />

    </div>
  );
}
