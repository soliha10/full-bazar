// m + LazyMotion: to'liq `motion` bosh sahifa bundle'iga ~30 KB (gzip) qo'shardi
import { LazyMotion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useBrands } from '../hooks/useBrands';
import { useMarkets } from '../hooks/useMarkets';
import { SEO, SITE_URL } from '../components/SEO';
import { useLandingData } from './landing/useLandingData';
import { Hero } from './landing/Hero';
import { StoreMarquee } from './landing/StoreMarquee';
import { DealsGrid } from './landing/DealsGrid';
import { BrandsSection } from './landing/BrandsSection';
import { StepsSection } from './landing/StepsSection';
import { FaqSection } from './landing/FaqSection';

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
  const brands = useBrands();
  const { markets } = useMarkets();
  const { stats, deals, dealsStatus, updated, retry } = useLandingData();

  // Hero dastasidagi takliflar pastdagi panjarada takrorlanmaydi
  const deck = deals.filter(p => (p.markets?.length ?? 0) >= 2).slice(0, 4);
  const deckIds = new Set(deck.map(p => p.id));
  const gridDeals = deals.filter(p => !deckIds.has(p.id));
  const storeList = markets.map(x => x.name).join(', ');

  return (
    <LazyMotion features={loadMotionFeatures}>
    <div className="min-h-screen pb-24 md:pb-6 transition-colors">
      <SEO
        title={t.landing.seoTitle}
        description={t.landing.seoDesc}
        keywords={['smartfonlar', 'telefon narxi', 'narx solishtirish', 'bazarcom', ...markets.slice(0, 6).map(x => x.name.toLowerCase())].join(', ')}
        locale={language}
        canonicalUrl={`${SITE_URL}/`}
      />

      {/* Tartib: qidiruv → kimdan narx olinadi → nimani tejash mumkin →
          brend bo'yicha tanlash → qanday ishlaydi → savollar. Bitta qidiruv,
          bitta chaqiruv: har bo'lim o'z vazifasini bajaradi, takror yo'q. */}
      <Hero stats={stats} deck={deck} updated={updated} dealsLoading={dealsStatus === 'loading'} />

      <StoreMarquee markets={markets} />

      <DealsGrid deals={gridDeals} status={dealsStatus} onRetry={retry} />

      <BrandsSection brands={brands} />

      <StepsSection />

      <FaqSection updated={updated} storeList={storeList}
        storesCount={stats ? String(stats.markets) : String(markets.length || '—')} />
    </div>
    </LazyMotion>
  );
}
