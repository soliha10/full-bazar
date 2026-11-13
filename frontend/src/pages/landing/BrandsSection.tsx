import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { BrandFacet } from '../../hooks/useBrands';
import { formatSum } from '../../utils/productMapper';
import { fmt, reveal, SectionHeader } from './shared';
import { Card } from "../../components/Card";
import { PAGE_CONTAINER } from '../../components/layout';

// 12 — 2, 3 va 4 ustunda ham to'liq qatorlar
const SHOWN = 12;

/** Brend plitkasi: brendning eng ko'p do'konda sotiladigan modeli rasmi, nom, modellar soni, eng arzon narx. */
function BrandTile({ b, index }: { b: BrandFacet; index: number }) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <li className="card-rise" style={{ '--i': index } as React.CSSProperties}>
      {/* Tor plitkada (md gacha) narx rasm ostida, butun kenglikda — 7 xonali narx
          sig'sin; md dan — rasm yonidagi ikkinchi qatorda; bezak strelkasi faqat xl da */}
      <Card as={Link} interactive padding="none" to={`/products?brand=${encodeURIComponent(b.key)}`}
        className="group grid h-full grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 md:gap-x-3.5 md:gap-y-0 p-2.5 sm:p-3">
        <span className="flex w-10 h-10 md:w-14 md:h-14 md:row-span-2 shrink-0 items-center justify-center overflow-hidden rounded-xl glass-soft">
          {b.image
            ? <img src={b.image} alt="" loading="lazy" className="w-full h-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
            // Rasm bo'lmasa — brend bosh harfi (rang/logo qo'lda yozilmaydi)
            : <span aria-hidden="true" className="text-lg font-semibold text-gray-400 dark:text-gray-500">{b.name.charAt(0)}</span>}
        </span>
        <span className="min-w-0 md:self-end">
          <span className="block truncate text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
            {b.name}
          </span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {h.brandModels.replace('{{count}}', fmt(b.count))}
          </span>
        </span>
        <ChevronRight aria-hidden="true"
          className="hidden xl:block xl:col-start-3 xl:row-start-1 xl:row-span-2 w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
        {b.min_price ? (
          <span className="col-span-2 md:col-span-1 md:col-start-2 md:self-start md:mt-0.5 truncate text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
            {h.brandFrom.replace('{{price}}', formatSum(b.min_price))}
          </span>
        ) : null}
      </Card>
    </li>
  );
}

/** Brendlar — /api/brands (bazada haqiqatda mahsuloti bor brendlar), eng ko'p modellilari. */
export function BrandsSection({ brands }: { brands: BrandFacet[] }) {
  const { t } = useLanguage();
  const h = t.home;
  if (brands.length === 0) return null;
  return (
    <m.section {...reveal} aria-labelledby="brands-title" className={`mt-14 md:mt-24 ${PAGE_CONTAINER}`}>
      <SectionHeader id="brands-title" title={h.brandsTitle} subtitle={h.brandsSubtitle}
        linkTo="/products" linkLabel={t.landing.trending.viewAll} />
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {brands.slice(0, SHOWN).map((b, i) => <BrandTile key={b.key} b={b} index={i} />)}
      </ul>
    </m.section>
  );
}
