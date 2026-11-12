import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product } from '../../components/ProductCard';
import { Carousel, MiniProductCard } from './Carousel';
import { reveal, SectionHeader } from './shared';

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
            linkTo="/products" linkLabel={t.landing.trending.viewAll} />
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
            linkTo="/products" linkLabel={t.landing.trending.viewAll} />
          <Carousel>
            {personalizedRecs.map(p => <MiniProductCard key={p.id} product={p} />)}
          </Carousel>
        </m.section>
      )}
    </>
  );
}
