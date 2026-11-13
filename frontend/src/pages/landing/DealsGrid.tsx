import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Product } from '../../components/ProductCard';
import { StoreLogo } from '../../components/StoreLogo';
import { reveal, SectionHeader, LoadError, priceSpread } from './shared';
import { ProductTile, ProductTileSkeleton } from "../../components/product-card/ProductTile";

/** Taklif kartasi: eng arzon do'kon (logo bilan), eng qimmat narx va farq foizi. */
function DealTile({ product, index }: { product: Product; index: number }) {
  const { t } = useLanguage();
  const h = t.home;
  const { low, high, pct, count } = priceSpread(product.markets);
  if (!low || !high) return null;

  return (
    <ProductTile to={productPath(product)} name={product.name} image={product.image} ratio="wide"
      className="card-rise" style={{ '--i': index } as React.CSSProperties}
      badge={pct > 0 && (
        <span className="rounded-full bg-emerald-500/95 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-white">
          {h.dealSave.replace('{{pct}}', String(pct))}
        </span>
      )}
      priceLabel={h.dealCheapest} price={formatSum(low.price)}
      meta={<><StoreLogo name={low.source} size="xs" /><span className="truncate">{low.source} · {h.dealStores.replace('{{count}}', String(count))}</span></>}
      footer={
        <span className="flex justify-end sm:justify-between gap-2">
          <span className="hidden sm:inline">{h.dealPriciest}</span>
          <span className="line-through tabular-nums">{formatSum(high.price)}</span>
        </span>
      } />
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
            ? Array.from({ length: 8 }, (_, i) => <ProductTileSkeleton key={i} ratio="wide" />)
            : deals.slice(0, fullRows(deals.length)).map((p, i) => <DealTile key={p.id} product={p} index={i} />)}
        </div>
      )}
    </m.section>
  );
}
