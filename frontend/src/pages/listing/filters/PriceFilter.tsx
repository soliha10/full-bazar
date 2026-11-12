import { useLanguage } from '../../../contexts/LanguageContext';
import { formatPriceInput, normalizePriceRange, priceNum } from '../constants';
import type { ListingFilters } from '../useListingFilters';
import { ClearButton, Section } from './ui';

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 transition-colors';

export function PriceFilter({ f, isMobile }: { f: ListingFilters; isMobile: boolean }) {
  const { t } = useLanguage();
  const { draftMinPrice, draftMaxPrice, setDraftMinPrice, setDraftMaxPrice, setMinPrice, setMaxPrice } = f;

  // Price mapping (both use draft states so typing doesn't refresh layout)
  const minPr = draftMinPrice;
  const maxPr = draftMaxPrice;

  const handleApplyPriceDesktop = () => {
    const [lo, hi] = normalizePriceRange(draftMinPrice, draftMaxPrice);
    setMinPrice(lo);
    setMaxPrice(hi);
    setDraftMinPrice(lo);
    setDraftMaxPrice(hi);
  };
  const minN = priceNum(minPr), maxN = priceNum(maxPr);
  const priceReversed = minN !== undefined && maxN !== undefined && minN > maxN;
  // Qo'llanmagan qiymat bormi — "Qo'llash" faqat shunda ko'rinadi
  const dirty = draftMinPrice !== f.minPrice || draftMaxPrice !== f.maxPrice;

  const clear = (minPr || maxPr) ? (
    <ClearButton label={t.listing.clear} onClick={() => {
      setDraftMinPrice('');
      setDraftMaxPrice('');
      if (!isMobile) {
        setMinPrice('');
        setMaxPrice('');
      }
    }} />
  ) : null;

  return (
    <Section title={`${t.listing.priceRange}, ${t.listing.currency}`} action={clear} isMobile={isMobile}>
      <div className="flex items-center gap-2">
        <input type="text" inputMode="numeric" placeholder={t.listing.priceFrom} value={minPr}
          aria-label={t.listing.priceFrom}
          onChange={e => setDraftMinPrice(formatPriceInput(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
          className={inputClass}
        />
        <span className="text-gray-300 dark:text-gray-600 text-sm shrink-0" aria-hidden="true">–</span>
        <input type="text" inputMode="numeric" placeholder={t.listing.priceTo} value={maxPr}
          aria-label={t.listing.priceTo}
          onChange={e => setDraftMaxPrice(formatPriceInput(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
          className={inputClass}
        />
      </div>
      {priceReversed && (
        <p role="alert" className="mt-2 text-xs leading-snug text-amber-600 dark:text-amber-400">
          {t.listing.priceRangeSwapped}
        </p>
      )}
      {!isMobile && dirty && (
        <button type="button" onClick={handleApplyPriceDesktop}
          className="mt-2 w-full rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium py-2 transition-colors">
          {t.common.apply}
        </button>
      )}
    </Section>
  );
}
