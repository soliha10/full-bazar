// m + LazyMotion: to'liq `motion` bosh sahifa bundle'iga ~30 KB (gzip) qo'shardi
import { LazyMotion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecommendations } from '../hooks/useRecommendations';
import { useFavorites } from '../hooks/useFavorites';
import { useBrands } from '../hooks/useBrands';
import { useMarkets } from '../hooks/useMarkets';
import { useAuth } from '../contexts/AuthContext';
import { SEO, SITE_URL } from '../components/SEO';
import { useLandingData } from './landing/useLandingData';
import { Hero } from './landing/Hero';
import { StatsRow } from './landing/StatsRow';
import { DealsSection, PersonalSection } from './landing/ProductRows';
import { StoresSection } from './landing/StoresSection';
import { BrandsSection } from './landing/BrandsSection';
import { StepsSection } from './landing/StepsSection';
import { FaqSection } from './landing/FaqSection';
import { CtaSection } from './landing/CtaSection';

const loadMotionFeatures = () => import('../utils/motionFeatures').then(r => r.default);

/*
 * Bosh sahifadagi HAR BIR raqam va ro'yxat API dan keladi:
 *   /api/stats            — mahsulot, do'kon, solishtirsa bo'ladigan modellar, oxirgi yangilanish
 *   /api/markets          — do'konlar va takliflar soni (hooks/useMarkets)
 *   /api/brands           — brendlar va modellar soni (hooks/useBrands)
 *   /api/recommendations  — do'konlar orasidagi eng katta narx farqi (haqiqiy narxlar)
 * Ilgari "19 ta do'kon", "500+", "Glotr +8%" kabi qiymatlar qo'lda yozilgan edi.
 * Ma'lumot kelmasa — o'ylab topilgan qiymat emas, skelet yoki xato ko'rsatiladi.
 */

export function Landing() {
  const { t, language } = useLanguage();
  const h = t.home;
  const { products: allProducts } = useProducts(1, 20);
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const brands = useBrands();
  const { markets, status: marketsStatus, retry: retryMarkets } = useMarkets();
  const clientRecs = useRecommendations(allProducts, 8);
  const showClientRecs = clientRecs.length > 0 && (favorites.length > 0 || !!user?.profile.preferredBrands.length);

  const {
    stats, statsFailed, deals, dealsStatus, personalizedRecs, personalizedType,
    updated, fill, retry,
  } = useLandingData();

  const showcase = deals.find(p => (p.markets?.length ?? 0) >= 3) ?? deals[0];
  const topBrands = brands.slice(0, 6);
  const storeList = markets.map(x => x.name).join(', ');

  return (
    <LazyMotion features={loadMotionFeatures}>
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 md:pb-0 transition-colors">
      <SEO
        title={t.landing.seoTitle}
        description={t.landing.seoDesc}
        keywords={['smartfonlar', 'telefon narxi', 'narx solishtirish', 'bazarcom', ...markets.slice(0, 6).map(x => x.name.toLowerCase())].join(', ')}
        locale={language}
        canonicalUrl={`${SITE_URL}/`}
      />

      {/* ══ HERO ══ */}
      <Hero hasStats={!!stats} fill={fill} showcase={showcase}
        dealsLoading={dealsStatus === 'loading'} topBrands={topBrands} />

      {/* ══ STATS ══ */}
      <StatsRow stats={stats} failed={statsFailed} updated={updated} onRetry={retry} />

      <DealsSection deals={deals} status={dealsStatus} onRetry={retry} />

      <PersonalSection clientRecs={clientRecs} showClientRecs={showClientRecs}
        fromFavorites={favorites.length > 0}
        personalizedRecs={personalizedRecs} personalizedType={personalizedType} />

      {/* ══ STORES ══ */}
      <StoresSection markets={markets} status={marketsStatus} onRetry={retryMarkets} />

      {/* ══ BRANDS ══ */}
      <BrandsSection brands={brands} />

      <StepsSection />

      <FaqSection updated={updated} storeList={storeList}
        storesCount={stats ? String(stats.markets) : String(markets.length || '—')} />

      <CtaSection subtitle={typeof stats?.comparableProducts === 'number' ? fill(h.ctaSubtitle) : null} />
    </div>
    </LazyMotion>
  );
}
