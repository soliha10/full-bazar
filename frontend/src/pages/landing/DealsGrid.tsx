import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProductCard, type Product } from '../../components/ProductCard';
import { reveal, SectionHeader, LoadError } from './shared';
import { ProductTileSkeleton } from "../../components/product-card/ProductTile";

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
            ? Array.from({ length: 8 }, (_, i) => <ProductTileSkeleton key={i} />)
            : deals.slice(0, fullRows(deals.length)).map((p, i) => (
                // Katalogdagi kartaning o'zi — bosh sahifa va katalog bir xil ko'rinishda
                <ProductCard key={p.id} product={p} className="card-rise" style={{ '--i': i } as React.CSSProperties} />
              ))}
        </div>
      )}
    </m.section>
  );
}
