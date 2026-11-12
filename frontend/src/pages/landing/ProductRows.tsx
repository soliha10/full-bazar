import { m } from 'framer-motion';
import { TrendingDown, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import type { Product } from '../../components/ProductCard';
import { Carousel, MiniProductCard, SkeletonCard } from './Carousel';
import { reveal, SectionHeader, LoadError } from './shared';

const dealGap = (p: Product) => {
  const prices = (p.markets ?? []).map(x => x.price);
  return prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;
};

/* ══ BIGGEST GAPS ══ */
export function DealsSection({ deals, status, onRetry }: {
  deals: Product[];
  status: 'loading' | 'ready' | 'error';
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="deals-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
      <SectionHeader id="deals-title" title={h.savingsTitle} subtitle={h.savingsSubtitle}
        icon={TrendingDown} linkTo="/products" linkLabel={t.landing.trending.viewAll} />
      {status === 'error' ? (
        <LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} />
      ) : (
        <Carousel>
          {status === 'loading'
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
            : deals.map(p => (
                <MiniProductCard key={p.id} product={p}
                  badge={dealGap(p) > 0 ? h.savingsBadge.replace('{{amount}}', formatSum(dealGap(p))) : undefined}
                  storesLabel={h.storesTag.replace('{{count}}', String(p.markets?.length ?? 0))} />
              ))}
        </Carousel>
      )}
    </m.section>
  );
}

/* ══ PERSONAL ══ */
// Avval mijozdagi (sevimlilar/profil asosidagi) tavsiyalar; ular bo'lmasa —
// serverning shaxsiy tavsiyalari, faqat turi "personalized" bo'lsa.
export function PersonalSection({ clientRecs, showClientRecs, fromFavorites, personalizedRecs, personalizedType }: {
  clientRecs: Product[];
  showClientRecs: boolean;
  fromFavorites: boolean;
  personalizedRecs: Product[];
  personalizedType: string;
}) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <>
      {showClientRecs && (
        <m.section {...reveal} aria-labelledby="foryou-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
          <SectionHeader id="foryou-title" title={t.landing.forYouTitle}
            subtitle={fromFavorites ? t.landing.forYouFromFavorites : t.landing.forYouFromProfile}
            icon={Sparkles} linkTo="/products" linkLabel={t.landing.trending.viewAll} />
          <Carousel>
            {clientRecs.map(p => (
              <MiniProductCard key={p.id} product={p}
                storesLabel={(p.markets?.length ?? 0) > 1 ? h.storesTag.replace('{{count}}', String(p.markets?.length)) : undefined} />
            ))}
          </Carousel>
        </m.section>
      )}
      {!showClientRecs && personalizedType === 'personalized' && personalizedRecs.length > 0 && (
        <m.section {...reveal} aria-labelledby="special-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
          <SectionHeader id="special-title" title={t.landing.specialTitle} subtitle={t.landing.specialSubtitle}
            icon={Sparkles} linkTo="/products" linkLabel={t.landing.trending.viewAll} />
          <Carousel>
            {personalizedRecs.map(p => <MiniProductCard key={p.id} product={p} />)}
          </Carousel>
        </m.section>
      )}
    </>
  );
}
