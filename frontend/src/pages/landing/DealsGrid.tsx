import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Product } from '../../components/ProductCard';
import { StoreLogo } from '../../components/StoreLogo';
import { reveal, SectionHeader, LoadError, PLACEHOLDER, priceSpread } from './shared';

/** Taklif kartasi: eng arzon do'kon (logo bilan), eng qimmat narx va farq foizi. */
function DealTile({ product, index }: { product: Product; index: number }) {
  const { t } = useLanguage();
  const h = t.home;
  const { low, high, pct, count } = priceSpread(product.markets);
  if (!low || !high) return null;

  return (
    <Link to={productPath(product)} style={{ '--i': index } as React.CSSProperties}
      className="group glass glass-hover card-rise rounded-3xl p-3 flex flex-col">
      <div className="relative aspect-[4/3] rounded-2xl bg-white dark:bg-white/[0.04] overflow-hidden">
        <img src={product.image || PLACEHOLDER} alt={product.name} loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          className="w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-[1.04]" />
        {pct > 0 && (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 rounded-full bg-emerald-500/95 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-white">
            {h.dealSave.replace('{{pct}}', String(pct))}
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 hidden sm:inline-flex glass-soft rounded-full px-2 py-1 text-[11px] text-gray-700 dark:text-gray-200">
          {h.dealStores.replace('{{count}}', String(count))}
        </span>
      </div>

      <div className="px-1.5 pt-3 pb-1 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{h.dealCheapest}</p>
            <p className="text-[15px] sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums leading-tight whitespace-nowrap">
              {formatSum(low.price)}
            </p>
          </div>
          <span className="flex items-center gap-1.5 min-w-0 text-xs text-gray-600 dark:text-gray-300">
            <StoreLogo name={low.source} size="sm" />
            <span className="truncate">{low.source}</span>
          </span>
        </div>
        <p className="mt-2 pt-2 border-t border-gray-900/5 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 flex justify-end sm:justify-between gap-2">
          <span className="hidden sm:inline">{h.dealPriciest}</span>
          <span className="line-through tabular-nums">{formatSum(high.price)}</span>
        </p>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="glass rounded-3xl p-3 animate-pulse" aria-hidden="true">
      <div className="aspect-[4/3] rounded-2xl bg-gray-200/70 dark:bg-gray-700/50" />
      <div className="mt-4 space-y-2 px-1.5">
        <div className="h-3 rounded-full bg-gray-200/70 dark:bg-gray-700/50 w-4/5" />
        <div className="h-5 rounded-full bg-gray-200/70 dark:bg-gray-700/50 w-2/5 mt-4" />
      </div>
    </div>
  );
}

/** To'rt ustunli panjarada chala qator qolmasin: 8, 4 yoki (kam bo'lsa) hammasi */
const fullRows = (n: number) => (n >= 8 ? 8 : n >= 4 ? 4 : n);

/* ══ BIGGEST GAPS ══ — /api/recommendations, har model bir marta */
export function DealsGrid({ deals, status, onRetry }: {
  deals: Product[];
  status: 'loading' | 'ready' | 'error';
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const h = t.home;
  if (status === 'ready' && deals.length === 0) return null;

  return (
    <m.section {...reveal} aria-labelledby="deals-title" className="mt-14 md:mt-24 px-4 max-w-7xl mx-auto">
      <SectionHeader id="deals-title" title={h.dealsTitle} subtitle={h.dealsSubtitle}
        linkTo="/products" linkLabel={t.landing.trending.viewAll} />
      {status === 'error' ? (
        <LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {status === 'loading'
            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} />)
            : deals.slice(0, fullRows(deals.length)).map((p, i) => <DealTile key={p.id} product={p} index={i} />)}
        </div>
      )}
    </m.section>
  );
}
