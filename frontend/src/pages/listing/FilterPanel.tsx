import type { FilterTab } from './constants';
import type { ListingFilters } from './useListingFilters';
import { PriceFilter } from './filters/PriceFilter';
import { SpecsFilter } from './filters/SpecsFilter';
import { RatingFilter, BrandFilter, StoreFilter } from './filters/ChoiceFilters';

/**
 * Filtrlar paneli. Desktopda barcha bo'limlar ketma-ket va darhol
 * qo'llanadi; mobil oynada faqat tanlangan tab ko'rinadi va qiymatlar
 * qoralamaga (draft) yoziladi — "Natijalarni ko'rish" bosilganda qo'llanadi.
 */
export function FilterPanel({ f, isMobile, mobileTab }: {
  f: ListingFilters;
  isMobile: boolean;
  mobileTab?: FilterTab;
}) {
  const { specFacets } = f;

  return (
    <div className={isMobile ? "px-1" : "divide-y divide-gray-200 dark:divide-gray-800"}>
      {/* Kategoriya filtri olib tashlandi: katalogdagi barcha mahsulotlar
          bitta "Phones" kategoriyasida, ya'ni u hech narsani filtrlamasdi. */}
      {/* Tartib foydalilik bo'yicha: narx, brend, do'kon — keyin tafsilotlar */}
      {(!isMobile || mobileTab === 'price') && <PriceFilter f={f} isMobile={isMobile} />}
      {(!isMobile || mobileTab === 'brand') && <BrandFilter f={f} isMobile={isMobile} />}
      {(!isMobile || mobileTab === 'store') && <StoreFilter f={f} isMobile={isMobile} />}
      {(!isMobile || mobileTab === 'specs') && (specFacets.ram.length > 0 || specFacets.storage.length > 0) && (
        <SpecsFilter f={f} isMobile={isMobile} />
      )}
      {(!isMobile || mobileTab === 'rating') && <RatingFilter f={f} isMobile={isMobile} />}
    </div>
  );
}
