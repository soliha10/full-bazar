import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProductCard, type Product } from '../../components/ProductCard';
import { reveal, SectionHeader, LoadError } from './shared';
import { ProductTileSkeleton } from "../../components/product-card/ProductTile";
import { ProductGrid } from "../../components/product-card/ProductGrid";
import { PAGE_CONTAINER, fullRowsClass } from "../../components/layout";

// 10 — 2 va 5 ustunda 2 qator, 3 ustunda 3 qator (9), 4 ustunda 2 qator (8)
const MAX_DEALS = 10;

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
    <m.section {...reveal} aria-labelledby="deals-title" className={`mt-14 md:mt-24 ${PAGE_CONTAINER}`}>
      <SectionHeader id="deals-title" title={h.dealsTitle} subtitle={h.dealsSubtitle}
        linkTo="/products" linkLabel={t.landing.trending.viewAll} />
      {status === 'error' ? (
        <LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} />
      ) : (
        // Katalogdagi setka va kartaning o'zi — o'lchamlar ikkala sahifada bir xil;
        // har ekranda faqat to'liq qatorlar (2/3/4/5 ustun) ko'rinadi
        <ProductGrid>
          {status === 'loading'
            ? Array.from({ length: MAX_DEALS }, (_, i) => (
                <div key={i} className={fullRowsClass(i, MAX_DEALS)}><ProductTileSkeleton /></div>
              ))
            : deals.slice(0, MAX_DEALS).map((p, i, list) => (
                <div key={p.id} className={fullRowsClass(i, list.length)}>
                  <ProductCard product={p} className="card-rise" style={{ '--i': i } as React.CSSProperties} />
                </div>
              ))}
        </ProductGrid>
      )}
    </m.section>
  );
}
