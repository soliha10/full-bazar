import { useLanguage } from '../../../contexts/LanguageContext';
import { BRAND_COLORS } from '../../../hooks/useBrands';
import { MARKETS_VISIBLE } from '../constants';
import type { ListingFilters } from '../useListingFilters';
import { Cb, SLabel } from './ui';

interface Props { f: ListingFilters; isMobile: boolean }

export function RatingFilter({ f, isMobile }: Props) {
  const { t } = useLanguage();
  // Rating mapping
  const rating = isMobile ? f.draftRating : f.minRating;
  const setRt = (v: number) => {
    const setter = isMobile ? f.setDraftRating : f.setMinRating;
    setter(v);
  };

  return (
    <div className={isMobile ? "py-1" : "py-3"}>
      <div className="flex items-center justify-between mb-2">
        <SLabel>{t.listing.rating}</SLabel>
        {rating > 0 && (
          <button onClick={() => setRt(0)} className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
        )}
      </div>
      <div className="space-y-0.5">
        {([0, 4.5, 4, 3] as const).map(r => (
          <button key={r} type="button" onClick={() => setRt(r)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-3 text-left text-[14px] transition-colors ${
              rating === r ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-semibold'
                           : 'text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100/55 dark:hover:bg-gray-900/40'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              rating === r ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {rating === r && <span className="w-2 h-2 rounded-full bg-violet-600" />}
            </span>
            {r === 0 ? <span>{t.listing.allRating}</span> : (
              <span className="flex items-center gap-1.5">
                <span className="text-amber-400 text-xs">{'★'.repeat(Math.floor(r))}{r % 1 ? '½' : ''}</span>
                <span>{r}+</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Brend va do'kon qatorlari bir xil ko'rinishda: belgi, rang nuqtasi, nom, soni. */
function ChoiceRow({ on, color, name, count, onClick }: {
  on: boolean; color: string; name: string; count?: number; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left hover:bg-gray-100/60 dark:hover:bg-gray-900/60 transition-colors group"
    >
      <Cb on={on} />
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className={`flex-1 text-[13px] transition-colors ${
        on ? 'text-violet-600 dark:text-violet-400 font-semibold'
           : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
      }`}>
        {name}
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">({count})</span>
      )}
    </button>
  );
}

export function BrandFilter({ f, isMobile }: Props) {
  const { t } = useLanguage();
  // Brand mapping
  const brand = isMobile ? f.draftBrand : f.selectedBrand;
  const setBr = (v: string | null) => {
    const setter = isMobile ? f.setDraftBrand : f.setSelectedBrand;
    setter(v);
  };

  return (
    <div className={isMobile ? "py-1" : "py-3"}>
      <div className="flex items-center justify-between mb-2">
        <SLabel>{t.listing.brands}</SLabel>
        {brand && (
          <button onClick={() => setBr(null)} className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
        )}
      </div>
      <div className="space-y-0.5">
        {f.brandFacets.map(({ key, name, count }) => {
          const on = brand === key;
          return (
            <ChoiceRow key={key} on={on} color={BRAND_COLORS[key] ?? '#9ca3af'} name={name}
              count={count > 0 ? count : undefined} onClick={() => setBr(on ? null : key)} />
          );
        })}
      </div>
    </div>
  );
}

export function StoreFilter({ f, isMobile }: Props) {
  const { t } = useLanguage();
  const { marketCounts, showAllMarkets, setShowAllMarkets } = f;
  // Marketplace mapping
  const mps = isMobile ? f.draftMarketplaces : f.selectedMarketplaces;
  const toggleMp = (key: string) => {
    const setter = isMobile ? f.setDraftMarketplaces : f.setSelectedMarketplaces;
    setter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const resetMps = () => {
    const setter = isMobile ? f.setDraftMarketplaces : f.setSelectedMarketplaces;
    setter([]);
  };

  // Do'konlar ro'yxati faqat /api/markets dan (hooks/useMarkets) — eng ko'p
  // mahsulotli do'konlar tepada. Statik zaxira ro'yxat yo'q.
  const markets = f.marketFacets;
  const visibleMarkets = (showAllMarkets || f.isMobileFilterOpen) ? markets : markets.slice(0, MARKETS_VISIBLE);

  return (
    <div className={isMobile ? "py-1" : "py-3"}>
      <div className="flex items-center justify-between mb-2">
        <SLabel>{t.listing.stores}</SLabel>
        {mps.length > 0 && (
          <button onClick={resetMps} className="text-[11px] text-violet-500 hover:underline leading-none">{t.listing.clear}</button>
        )}
      </div>
      <div className="space-y-0.5">
        {visibleMarkets.map(({ name, key, color }) => (
          <ChoiceRow key={key} on={mps.includes(key)} color={color} name={name}
            count={marketCounts[key]} onClick={() => toggleMp(key)} />
        ))}
      </div>
      {!isMobile && markets.length > MARKETS_VISIBLE && (
        <button type="button" onClick={() => setShowAllMarkets(v => !v)}
          className="mt-1.5 ml-1.5 text-[12px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          {showAllMarkets ? t.listing.showLess : t.listing.showAll.replace('{{count}}', markets.length.toString())}
        </button>
      )}
    </div>
  );
}
