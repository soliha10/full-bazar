import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { MARKETS_VISIBLE } from '../constants';
import type { ListingFilters } from '../useListingFilters';
import { Cb, ClearButton, Section } from './ui';

interface Props { f: ListingFilters; isMobile: boolean }

/** Brendlar ham do'konlar kabi qisqa ro'yxat bilan boshlanadi */
const BRANDS_VISIBLE = 8;

export function RatingFilter({ f, isMobile }: Props) {
  const { t } = useLanguage();
  // Rating mapping
  const rating = isMobile ? f.draftRating : f.minRating;
  const setRt = (v: number) => {
    const setter = isMobile ? f.setDraftRating : f.setMinRating;
    setter(v);
  };

  return (
    <Section title={t.listing.rating} isMobile={isMobile} defaultOpen={rating > 0}
      action={rating > 0 ? <ClearButton label={t.listing.clear} onClick={() => setRt(0)} /> : null}>
      <div role="radiogroup" aria-label={t.listing.rating} className="space-y-0.5">
        {([0, 4.5, 4, 3] as const).map(r => (
          <button key={r} type="button" role="radio" aria-checked={rating === r} onClick={() => setRt(r)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
              rating === r ? 'text-violet-700 dark:text-violet-300 font-medium'
                           : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
              rating === r ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {rating === r && <span className="w-2 h-2 rounded-full bg-violet-600" />}
            </span>
            {r === 0 ? t.listing.allRating : `${r}+ ★`}
          </button>
        ))}
      </div>
    </Section>
  );
}

/** Brend va do'kon qatorlari bir xil ko'rinishda: belgi, nom, soni. */
function ChoiceRow({ on, name, count, onClick }: {
  on: boolean; name: string; count?: number; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
    >
      <Cb on={on} />
      <span className={`flex-1 text-sm ${on ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
        {name}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{count}</span>
      )}
    </button>
  );
}

function MoreToggle({ expanded, total, onClick }: { expanded: boolean; total: number; onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button type="button" onClick={onClick}
      className="mt-1 ml-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
      {expanded ? t.listing.showLess : t.listing.showAll.replace('{{count}}', total.toString())}
    </button>
  );
}

export function BrandFilter({ f, isMobile }: Props) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  // Brand mapping
  const brand = isMobile ? f.draftBrand : f.selectedBrand;
  const setBr = (v: string | null) => {
    const setter = isMobile ? f.setDraftBrand : f.setSelectedBrand;
    setter(v);
  };
  const all = f.brandFacets;
  // Tanlangan brend qisqa ro'yxatdan tashqarida bo'lsa ham ko'rinib tursin
  const short = all.slice(0, BRANDS_VISIBLE);
  const picked = all.find(b => b.key === brand);
  const visible = showAll || isMobile ? all
    : picked && !short.includes(picked) ? [...short, picked] : short;

  return (
    <Section title={t.listing.brands} isMobile={isMobile}
      action={brand ? <ClearButton label={t.listing.clear} onClick={() => setBr(null)} /> : null}>
      <div className="space-y-0.5">
        {visible.map(({ key, name, count }) => {
          const on = brand === key;
          return (
            <ChoiceRow key={key} on={on} name={name}
              count={count > 0 ? count : undefined} onClick={() => setBr(on ? null : key)} />
          );
        })}
      </div>
      {!isMobile && all.length > BRANDS_VISIBLE && (
        <MoreToggle expanded={showAll} total={all.length} onClick={() => setShowAll(v => !v)} />
      )}
    </Section>
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
    <Section title={t.listing.stores} isMobile={isMobile}
      action={mps.length > 0 ? <ClearButton label={t.listing.clear} onClick={resetMps} /> : null}>
      <div className="space-y-0.5">
        {visibleMarkets.map(({ name, key }) => (
          <ChoiceRow key={key} on={mps.includes(key)} name={name}
            count={marketCounts[key]} onClick={() => toggleMp(key)} />
        ))}
      </div>
      {!isMobile && markets.length > MARKETS_VISIBLE && (
        <MoreToggle expanded={showAllMarkets} total={markets.length} onClick={() => setShowAllMarkets(v => !v)} />
      )}
    </Section>
  );
}
