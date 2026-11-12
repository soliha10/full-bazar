import { useLanguage } from '../../../contexts/LanguageContext';
import { formatPriceInput, normalizePriceRange, priceNum } from '../constants';
import type { ListingFilters } from '../useListingFilters';
import { SLabel } from './ui';

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

  return (
    <div className={isMobile ? "py-1" : "py-3"}>
      <div className="flex items-center justify-between mb-2.5">
        <SLabel>{t.listing.priceRange}</SLabel>
        {(minPr || maxPr) && (
          <button onClick={() => {
            setDraftMinPrice('');
            setDraftMaxPrice('');
            if (!isMobile) {
              setMinPrice('');
              setMaxPrice('');
            }
          }}
            className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input type="text" inputMode="numeric" placeholder={t.listing.priceFrom} value={minPr}
          onChange={e => setDraftMinPrice(formatPriceInput(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
          className="w-full min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/40 transition"
        />
        <span className="text-gray-400 text-sm shrink-0">—</span>
        <input type="text" inputMode="numeric" placeholder={t.listing.priceTo} value={maxPr}
          onChange={e => setDraftMaxPrice(formatPriceInput(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') handleApplyPriceDesktop(); }}
          className="w-full min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/40 transition"
        />
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 font-semibold uppercase tracking-wider">{t.listing.currency}</p>
      {priceReversed && (
        <p role="alert" className="mt-1.5 text-[11px] leading-snug font-semibold text-amber-600 dark:text-amber-400">
          {t.listing.priceRangeSwapped}
        </p>
      )}

      {!isMobile && (
        <button
          type="button"
          onClick={handleApplyPriceDesktop}
          className="mt-2.5 w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-[11px] font-black py-2 rounded-xl shadow-md shadow-violet-500/10 transition-all"
        >
          {t.listing.viewResults}
        </button>
      )}
    </div>
  );
}
